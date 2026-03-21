/*
 * battleの定義
 */

/*
 * namespace battle
 *
 * 公開されるのは battle.mainScene のみ
 */
var battle = battle || {};
(function(Public){

/*--- 1. SkillDealerBase, EnemyDealerBaseの派生クラス ---*/

let SkillDealer = class extends SkillDealerBase{
    constructor(owner){
        super();
        this.owner = owner;
    }

    // サブクラスが実装する処理 (基本情報)
    enemyHP(){
        return this.owner.enemy.HP();
    }

    // サブクラスが実装する処理 (攻撃時に実行)
    *addHP(percent){
        const v = this.owner.player.percentHP(percent);
        this.owner.player.addHP(v);
        yield* this.wait(60);
        yield* this.playerChanged();
    }
    *addMP(percent){
        const v = this.owner.player.percentMP(percent);
        this.owner.player.addMP(v);
        yield* this.wait(60);
    }
    *addSG(percent){
        this.owner.player.addSG(percent);
        yield* this.wait(60);
    }
    *addHPSG(percent){
        const v = this.owner.player.percentHP(percent);
        this.owner.player.addHP(v);
        this.owner.player.addSG(percent);
        yield* this.wait(60);
        yield* this.playerChanged();
    }
    *addShield(n){
        this.owner.player.addShield(n);
    }
    *chargeUp(percent){
        this.owner.poolView.frames = 45;
        this.owner.pool.chargeBonus += percent;
        this.owner.pool.applyBonus();
        yield* this.wait(60);
    }
    *reduceEnemyMP(percent){
        const v = this.owner.enemy.percentMP(percent);
        this.owner.enemy.addMP(-v);
        yield* this.wait(60);
    }
    *suitSpecificBoost(str, mark, percent){
        if(mark < PrimitiveSuits.length){
            MPBoostBySuit.primitive[mark] += percent;
            if(this.owner.player.mark() == mark){
                const v = this.owner.player.percentMP(percent);
                this.owner.player.addMP(v);
            }
        }
        else{
            MPBoostBySuit.prismatic += percent;
            if(this.owner.player.isPrismatic()){
                const v = this.owner.player.percentMP(percent);
                this.owner.player.addMP(v);
            }
        }
        this.owner.pool.recalculate();
        yield* this.wait(60);
    }
    *damage(percent){
        const v = this.owner.player.percentMP(percent);
        GE.se.play("hit0");  // 試しにSEを入れてみる
        this.owner.enemy.addHP(-v);
        this.owner.shakeEnemy();  // shake_test
        yield* this.wait(60);
    }
    *extendTime(n){
        this.owner.maxTimeCount += n;
    }
    *timeWarp(){
        this.owner.backupArgs.playerData.main = null;
        this.owner.init();  // !?
        this.owner.GE.changeScene("main", this.owner.backupArgs);  // !?
    }

    // サブクラスが実装する処理 (ターン開始時に実行)
    *heal(percent){
        this.owner.add(new QBTalk("体力が回復するよ。", 60));
        const v = this.owner.player.percentHP(percent);
        this.owner.player.addHP(v);
        yield* this.wait(120);
        yield* this.playerChanged();
    }
    *SGHeal(percent){
        this.owner.add(new QBTalk("ソウルジェムが浄化されるよ。", 60));
        this.owner.player.addSG(percent);
        yield* this.wait(120);
    }

    // サブクラスが実装する処理 (HPの変化に伴い呼び出される)
    *crisisBoostTask(percent){
        if(this.owner.player.HP() <= 0) return; // 既に敗北しているときは省略
        const f = (this.owner.player.retentionRateHP() <= 0.5);
        if(this.appliedCB == percent){
            if(percent > 0 && !f){
                // 適用中かつ条件から外れた
                this.owner.player.addMP(-this.owner.player.percentMP(percent));
                this.appliedCB = 0;
                if(percent > 0) yield* this.wait(60);
            }
        }
        else{
            if(f){
                //条件を満たしているが適用量がpercentでない
                const a = percent - this.appliedCB;
                this.owner.player.addMP(this.owner.player.percentMP(a));
                this.appliedCB = percent;
                if(a > 0) yield* this.wait(60);
            }
            else if(!f && this.appliedCB > 0){
                //条件を満たしていない
                this.owner.player.addMP(-this.owner.player.percentMP(this.appliedCB));
                yield* this.wait(60);
                this.appliedCB = 0;
            }
        }
    }
}

let EnemyActionDealer = class extends EnemyActionDealerBase{
    constructor(owner){
        super();
        this.owner = owner;
    }

    // サブクラスが実装する処理 (基本情報)
    turnCount(){
        return this.owner.turn;
    }
    playerHP(){
        return this.owner.player.HP();
    }

    // サブクラスが実装する処理 (ターン開始時に実行)
    *common(action){
        yield* this.wait(20);
        this.owner.add( createSkillDialog(action) );
        yield* this.wait(130);
    }
    *antiskill(callback){
        const id = this.owner.player.id();
        if(this.owner.player.mainSkillCount() > 0 && this.owner.enemy.antiskillContains(id)){
            const yesno = new QBYesNo("アンチスキルを使うかい？\nA → YES    S → No", 20);
            this.owner.addSprite(yesno);
            this.owner.addTask(yesno, true);
            while(yesno.active) yield true;
            if(yesno.result){
                this.owner.add(new QBTalk("敵スキルを打ち消したよ。", 60));
                this.owner.player.shiftMainSkill();
                yield* this.wait(100);
                callback();
            }
        }
    }
    *poison(percent){
        this.owner.add(new QBTalk("敵スキルの効果でダメージを受けるよ。", 60));
        const v = this.owner.player.percentHP(percent);
        GE.se.play("hit1");  // 試しにSEを入れてみる
        this.owner.shakePlayer();  // shaker_test
        this.owner.player.addHP(-v);
        yield* this.wait(120);
        yield* this.owner.SD.playerChanged();
    }
    *stun(n){
        this.owner.player.addStun(n);
    }
    *damage(percent){
        const v = this.owner.enemy.percentMP(percent);
        GE.se.play("hit1");  // 試しにSEを入れてみる
        this.owner.shakePlayer();  // shaker_test
        this.owner.player.addHP(-v);
        yield* this.wait(60);
        yield* this.owner.SD.playerChanged();
    }
    *nightmare(str, mark, percent){
        // 基本属性に対して
        for(let m = 0; m < PrimitiveSuits.length; m++){
            if(m != mark){
                MPBoostBySuit.primitive[m] -= percent;
                if(MPBoostBySuit.primitive[m] < 0){
                    MPBoostBySuit.primitive[m] = 0;
                }
            }
        }
        if(this.owner.player.mark() != mark){
            const v = this.owner.player.percentMP(percent);
            this.owner.player.addMP(-v);
        }

        // 複合属性に対して
        MPBoostBySuit.prismatic -= percent;
        if(MPBoostBySuit.prismatic < 0){
            MPBoostBySuit.prismatic = 0;
        }
        if(this.owner.player.isPrismatic()){
            const v = this.owner.player.percentMP(percent);
            this.owner.player.addMP(-v);
        }
        yield* this.wait(60);
    }
    *transform(enemyName){
        const data = EnemyData[enemyName];
        this.owner.backupArgs.enemyData = data; // 敵設定を上書き
        this.owner.enemy.init(data, this.owner.player.suitString());
        this.init(data.actions);
        yield* this.wait(60);
    }
}


/*--- 2. プライベート関数  ---*/

/**
 * 登録されたオブジェクトを振動させるために使う（将来は別のファイルに移すかも）。
 * ターゲットの x 属性を直接変化させるので注意
 */
let Shaker = class{
    constructor(speed, acc, count){
        this.speed = speed;
        this.acc = acc;
        this.count = count;
        this.target = [];
    }

    add(...obj){
        this.target.push(...obj);
    }

    activate(speed = null, acc = null, count = null){
        this.backup = this.target.map((e) => e.x);
        this.dir = 1;
        this.v0 = this.v = speed || this.speed;
        this.a = acc ? -acc : -this.acc;
        this.n = count || this.count;
        this.active = true;
    }

    execute(GE){
        if(this.n <= 0){
            this.active = false;
            for(let i = 0; i < this.target.length; i++){
                this.target[i].x = this.backup[i];
            }
            return true;
        }

        for(const obj of this.target){
            obj.x += this.v;
        }

        this.v += this.a;
        if(this.v0 + this.v * this.dir <= 0){
            this.dir *= -1;
            this.a *= -1;
            this.n--;
        }

        return true;
    }
}

let bindPlayer = function(scene, player, x, y){
    const nameView = T.text(player.name(), {x: x, y: y+90, font: "27px Sans-Serif"});

    const HPMeterView = createMeterView("HP", player.HPMeter, x, y, 750);
    const HPView = T.ftext("HP: ${}", player.HPMeter, "value",
                          {x: x, y: y-70, font: "27px Sans-Serif"});
    const MPView = T.ftext("MP: ${}", player.MPMeter, "value",
                          {x: x, y: y-30, font: "27px Sans-Serif"});
    const SGMeterView = createMeterView("SG", player.SGMeter, x, y+35, 750);

    player.bind(scene);
    scene.add(nameView);
    scene.add(HPMeterView);
    scene.add(HPView);
    scene.add(MPView);
    scene.add(SGMeterView);

    const shieldView = T.text("", {x: x, y: y-110, font: "27px Sans-Serif"});
    shieldView.execute = (GE) => {
        shieldView.text = (player.shield() > 0) ? `シールド: ${player.shield()}` : "";
        return true;
    };
    scene.add(shieldView);

    // shaker_test
    scene.pShaker = new Shaker(4, 2, 3);
    scene.pShaker.add(nameView, HPMeterView, HPView, MPView, shieldView, SGMeterView);
}

let bindEnemy = function(scene, enemy, x, y){
    enemy.bind(scene);
    const nameView = T.text(enemy.name(), {x: x+740, y: y-10, font: "27px Sans-Serif", textAlign: "right"});

    const HPView = T.ftext("HP: ${}", enemy.HPMeter, "value", {x: x+600, y: y+70, font: "27px Sans-Serif"});
    const MPView = T.ftext("MP: ${}", enemy.MPMeter, "value", {x: x+600, y: y+110, font: "27px Sans-Serif"});
    const HPMeterView = createMeterView("HP", enemy.HPMeter, x, y, 750, true);
    scene.add(nameView);
    scene.add(HPMeterView);
    scene.add(HPView);
    scene.add(MPView);

    // shaker_test
    scene.eShaker = new Shaker(4, 2, 3);
    scene.eShaker.add(nameView, HPView, MPView, HPMeterView);
}

let delivery = function(card, addr1, addr2, callback){
    const obj = T.scheduler( T.slider(T.custom(card), addr1.x, addr1.y) );
    obj.slideTo(addr2.x, addr2.y, 18);
    obj.after(18, (GE, obj) => {
        callback(card);
        obj.active = false;
    });
    return obj;
}

let createPhysicalButton = function(x, y, key, label) {
    return {
        x: x, y: y, key: key, label: label, isPressed: false, active: true,
        draw(GE, ctx) {
            ctx.save();
            // 押されている間はボタンを少し下げて暗くする演出
            const offsetY = this.isPressed ? 5 : 0;
            ctx.translate(this.x, this.y + offsetY);

            // ボタン本体（円）
            ctx.beginPath();
            ctx.arc(0, 0, 22, 0, Math.PI * 2);
            ctx.fillStyle = this.isPressed ? "#555" : "#aaa";
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 4;
            ctx.stroke();

            // ラベル文字（A, S, D）
            ctx.fillStyle = this.isPressed ? "white" : "black";
            ctx.font = "bold 20px Sans-Serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.label, 0, 2);
            ctx.restore();
        },

        execute(GE){
            const fn = this.isPressed ? "isDown" : "isJustPressed";
            this.isPressed = !this.locked && GE.input[fn](this.key); // キーが押されているか判定
            return true;
        }
    };
}

let createMeterView = function(caption, target, x, y, len, reversed = false){
    return {
        x: x, y: y, active: true,
        draw(GE, ctx){
            ctx.save();
            ctx.fillStyle = "rgba(200,200,200,1)";
            ctx.fillRect(this.x-2,this.y-2, len+4, 24);
            ctx.fillStyle = "rgba(50,50,50,1)";
            ctx.fillRect(this.x, this.y, len, 20);

            const width = len * target.value / target.max;
            const x = reversed ? (this.x + len - width) : this.x;
            const g = ctx.createLinearGradient(this.x-width, this.y-20, this.x+width*1.5, this.y+20);
            g.addColorStop(0, "royalblue");
            g.addColorStop(1, "rgba(0,191,255,1)");
            ctx.fillStyle = g;
            ctx.fillRect(x, this.y, width, 20);

            const cx = (reversed ? this.x + len - 4 : this.x + 4);
            const cy = this.y + 16;
            ctx.textAlign = (reversed ? "right" : "left");
            ctx.font = "18px Sans-Serif";
            ctx.fillStyle = "white";
            ctx.fillText(caption, cx, cy);
            ctx.restore();
        }
    };
}

let createDeckView = function(target, x, y){
    return {
        target: target, x: x, y: y, active: true,
        addr(){
            return {x: this.x, y: this.y};
        },
        draw(GE, ctx){
            let i, tmp;
            ctx.save();
            ctx.font = "32px sans-serif";
            ctx.fillStyle = "white";
            ctx.fillText(`Rest ${this.target.size()}`, this.x, this.y + Card.height + 40);
            for(i = 0; i < 2; i++){
                const x = this.x + i * (5 + Card.width);
                this.target.watch(i).paint(GE, ctx, x, this.y);
            }
            ctx.restore();
        }
    };
}

let createPoolView = function(target, x, y){
    const chainFont = {
        font: "bold 24px Sans-Serif", color: "#ffff55",
        //lineWidth: 0.5, lineJoin: "round"
    };
    const step = 15;

    return {
        target: target, x: x, y: y, active: true,
        meter: createMeter(0, 9999, 10),
        history: 0, frames: 10,
        addr(){
            return {x: this.x + this.target.size() * step, y: this.y};
        },
        createChainEffect(GE){
            const x = this.x + this.target.size() * step - 15;
            const text = T.text("COMBO!", chainFont);
            const sp = T.slider(T.finite(text, 20), x, this.y-15);
            sp.slideTo(x, this.y-20, 15);
            return sp;
        },
        draw(GE, ctx){
            let i;
            ctx.save();
            for(i = 0; i < this.target.size(); i++){
                const x = this.x + i * step;
                this.target.watch(i).paint(GE, ctx, x, this.y);
            }
            if(!this.showOnlyCards){
                ctx.fillStyle = "white";
                ctx.font = "24px Sans-Serif";
                ctx.fillText(`MP: ${this.meter.value}`, this.x, this.y + Card.height + 30);
                if(this.target.skills.length > 0){
                    ctx.fillText(`スキル×${this.target.skills.length}`,
                                 this.x + 135, this.y + Card.height + 30);
                }
            }
            ctx.restore();
        },
        execute(GE){
            if(this.history != this.target.chargedMP){
                this.history = this.target.chargedMP;
                this.meter.changeTo(this.target.chargedMP, this.frames);
            }
            if(this.frames > 10) this.frames = 10;
            this.meter.execute(GE);
            return true;
        }
    };
}

let createTimeCount = function(maxTimeCount, x, y){
    const obj = T.scheduler(
        T.text(`${maxTimeCount}`, {x: x, y: y, font: "70px Sans-Serif", textAlign: "center"})
    );

    obj.currentCount = maxTimeCount;
    obj.after(1, (GE, obj) => {
        GE.se.play("tick");
        obj.loop(60, (GE, obj) => {
            GE.se.play("tick");
            if(obj.currentCount == 1 || GE.input.isDown("Space")) {
                obj.active = false;
                return false;
            }
            obj.text = String(--obj.currentCount);
            return true;
        });
    });
    return obj;
}

let createAttackDialog = function(){
    const img = GE.caches.get("DIALOG");
    const obj = {
        active: true,
        draw(GE, ctx){
            ctx.save();
            ctx.drawImage(img, 0, 0);
            ctx.fillStyle = "white";
            ctx.font = "bold 50px Serif";
            ctx.fillText("A：アタック", 120, 250);
            ctx.fillText("S：ＳＧ回復", 120, 340);
            ctx.fillText("D：スキル", 120, 430);
            ctx.restore();
        }
    };
    return obj;
}

let createSkillDialog = function(skill){
    const img = GE.caches.get("DIALOG");
    const msgs = skill.desc.split("\n");
    const obj = T.scheduler(T.fader( T.custom({
        paint(GE, ctx, x, y){
            ctx.save();
            ctx.drawImage(img, 0, 0);
            ctx.fillStyle = "white";
            ctx.font = "bold 50px Serif";
            ctx.fillText(`[${skill.caption}]`, 120, 250);

            ctx.font = "bold 32px Serif";
            for(let i = 0; i < msgs.length; i++){
                ctx.fillText(msgs[i], 120, 330+i*45);
            }
            ctx.restore();
        }
    }), 0));
    obj.fadeTo(1, 7);
    obj.after(90, (GE, self) => {
        self.fadeTo(0, 10);
        self.after(10, (GE, self) => { self.active = false; });
    });
    return obj;
}


/*--- 3. mainScene ---*/

/**
 * バトルを実行するSceneオブジェクトを作って公開する。
 */
Public.mainScene = new stdgam.Scene({
x: 160,
y: 0,

// shaker_test
shakePlayer(){
    if(this.pShaker.active) return;
    this.pShaker.activate();
    this.addTask(this.pShaker);
},

shakeEnemy(){
    if(this.eShaker.active) return;
    if(this.enemy.retentionRateHP() > 0.5){
        this.eShaker.activate(1, 0.5, 1);
    }
    else{
        this.eShaker.activate(6, 2, 3);
    }
    this.addTask(this.eShaker);
},

textOpt: {
    time: { font: "27px Sans-Serif", textAlign: "center" },
    score: { font: "27px Sans-Serif" },
    turn: { font: "80px Serif", textAlign: "center" },
    points: { color: "orange", font: "bold 36px Sans-Serif" },
    clear: { color: "yellow", font: "bold 100px Serif", textAlign: "center" }
},

initComponents(args){
    this.deck = args.deck;
    this.sideboard = args.sideboard;
    this.pool = new Pool(args.chainRule != 2 ? 1 : 2);
    this.busy = false;
    this.turn = 0;
    this.maxTimeCount = 5;

    this.hand = [];
    this.SD = new SkillDealer(this);
    this.EAD = new EnemyActionDealer(this);

    this.player = new Player(args.playerData);
    this.enemy = new Enemy(args.enemyData || EnemyData["キュゥべえ"], args.playerData.suit_string);
    this.EAD.init( args.enemyData ? args.enemyData.actions : []);

    this.poolView = createPoolView(this.pool, this.x+70, this.y+150);
    this.deckView = createDeckView(this.deck, this.x+440, this.y+350);
    this.init();
},

checkInput(GE){
    const codes = ["KeyA", "KeyS", "KeyD"];
    return codes.findIndex((e) => GE.input.isJustPressed(e));
},

judgement(){
    if(this.enemy.HP() == 0) return true;
    if(this.player.HP() == 0) return false;
    return (this.player.retentionRateHP() >= this.enemy.retentionRateHP());
},

// backupと言っているのにそれを改変してくる時間遡行者もいるけど・・・
// 実はシャルロッテも敵データを改変するので注意
backupOptions(args){
    this.backupArgs = {
        deck: args.deck.clone(),  // 未使用時に戻すため
        sideboard: args.sideboard.clone(),
        playerData: {...args.playerData},  // timeWarp時に改変されるので
        enemyData: (args.enemyData ? {...args.enemyData} : null),
        chainRule: args.chainRule
    };
},

onLoad(GE, args){
    MPBoostBySuit.init();
    this.backupOptions(args);
    this.initComponents(args);
    this.add(T.image(GE.caches.get("BACKGROUND"), {x: 0, y: 0}));
    this.add(T.image(GE.caches.get("CARDMAT"), {x: 0, y: 0}));

    const btnLabels = ["A", "S", "D"];
    const btnKeys = ["KeyA", "KeyS", "KeyD"];
    for (let i = 0; i < 3; i++) {
        // 手札のカードの中心（Card.width/2）に合わせる
        const bx = this.x+100 + i * (5 + Card.width) + Card.width / 2;
        const by = this.y+500; // 手札（y=300）の下
        this.add(createPhysicalButton(bx, by, btnKeys[i], btnLabels[i]));
    }

    bindPlayer(this, this.player, this.x-120, this.y+550);
    bindEnemy(this, this.enemy, this.x+50, this.y+60);
    this.openingQB = createOpeningQB(args);

    this.add(this.poolView);
    this.addSprite(this.deckView);
    this.useCoroutine(GE, args, this.chart);
},

*chart(GE){
    yield* this.SD.wait(10);
    yield* this.firstDeal(GE, this);
    while(this.turn <= 4 && this.player.HP() > 0){
        yield* this.phase1(GE, this);
        yield* this.SD.upkeep(GE);
        yield* this.EAD.upkeep(GE);
        if(this.player.HP() <= 0 || this.enemy.HP() <= 0) break;

        yield* this.mainSkill(GE, this);
        if(this.player.HP() <= 0 || this.enemy.HP() <= 0) break;

        // 追加スキャンの処理
        yield* this.extraScan(GE, this);
        if(this.player.HP() <= 0 || this.enemy.HP() <= 0) break;

        yield* this.EAD.specialAction(GE);
        if(this.player.HP() <= 0 || this.enemy.HP() <= 0) break;

        yield* this.phase2(GE, this);
        yield* this.waitWhileBusy(GE, this);
        yield* this.attackPhase(GE, this);
        if(this.player.HP() <= 0 || this.enemy.HP() <= 0) break;

        yield* this.defencePhase(GE, this);
    }
    yield* this.ending(GE, this);
},

*firstDeal(GE, self){
    this.addSprite(this.openingQB);
    this.addTask(this.openingQB, true);

    for(let i = 0; i < 3; i++){
        this.hand.push(T.custom(new Card(), { x: this.x+100+i*(5+Card.width), y: this.y+350 }));
        this.add(this.hand[i]);

        const obj = T.pause(60);
        const d = delivery(this.deck.shift(), this.deckView, this.hand[i],
            (card) => { this.hand[i].contents = card; }
        );
        this.addTaskAfter(this.openingQB, obj);
        this.addTask(d, true);
        this.addSprite(d, false);
        while(obj.active) yield true;
    }

    while(this.openingQB.active) yield true;
},

*phase1(GE, self){
    this.turn++;
    this.add(T.finite(
        T.text(`Turn ${this.turn}`, {x: 500, y: 180, ...this.textOpt.turn}),
        90));
    yield* this.SD.wait(90);
},

*mainSkill(GE, self){
    if(this.player.mainSkillCount() <= 0) return;
    const yesno = new QBYesNo("メインスキルを使うかい？\nA → YES    S → No", 20);
    this.addSprite(yesno);
    this.addTask(yesno, true);
    while(yesno.active) yield true;

    if(yesno.result){
        const mainSkill =  this.player.shiftMainSkill();
        yield* this.SD.wait(20);
        this.add( createSkillDialog(mainSkill) );
        yield* this.SD.wait(130);
        yield* this.SD.deal(GE, mainSkill);
    }
},

*extraScan(GE, self){
    if(this.deck.size() > 0 || this.sideboard.size() == 0) return;
    if(!this.hand.every((e) => e.contents.value == 0)) return;
    const yesno = new QBYesNo("追加スキャンを行うかい？\nA → YES    S → No", 20);
    this.addSprite(yesno);
    this.addTask(yesno, true);
    while(yesno.active) yield true;

    if(yesno.result){
        const dialog = new config.SideboardDialog(
            this, this.sideboard, null,
            200, 140, 600, 420);
        this.addSprite(dialog);
        this.addTask(dialog, true);
        while(dialog.active) yield true;

        const card = dialog.result;
        if(card){
            GE.se.play("heal");
            //this.sideboard.remove(card);  // 同じカードを複数回スキャンできる
            this.pool.extraScan(card);
            yield* this.SD.wait(60);
        }
    }
},

*phase2(GE, self){
    yield* this.SD.wait(10);

    if(this.player.stun() > 0){
        this.add(new QBTalk("行動を封じられて動けない！", 100));
        this.add(T.finite(T.text("STUN!", {x: this.x-110, y: this.y+60, font: "32px Sans-Serif"}), 120));
        yield* this.SD.wait(120);
        return;
    }

    const timer = createTimeCount(this.maxTimeCount, this.x-70, this.y+120);
    this.add(timer);
    this.add(T.finite(T.text("TIME", {x: this.x-70, y: this.y+50, ...this.textOpt.time}), 300));

    while(timer.active){
        const i = this.checkInput(GE);
        if(i >= 0 && !this.busy && this.hand[i].contents.value != 0){
            this.phase2_body(GE, i);
        }
        yield true;
    }
},
phase2_body(GE, i){
    if(!this.player.payCost(this.hand[i].contents.value)){
        this.add(new QBTelop("ソウルジェムが濁っているよ"));
        return;
    }

    this.add( delivery(this.hand[i].contents, this.hand[i], this.poolView.addr(),
        (card) => {
            this.pool.push(card);
            if(this.pool.hyped){
                 this.add(this.poolView.createChainEffect(GE));
            }
            this.busy = false;
        }
    ));
    this.add( delivery(this.deck.shift(), this.deckView.addr(), this.hand[i],
        (card) => { this.hand[i].contents = card; }
    ));
    this.hand[i].contents = new Card(0);
    this.busy = true;
},

*waitWhileBusy(GE, self){
    while(this.busy) yield true;
    yield* this.SD.wait(60);
},

*attackPhase(GE, self){
    if(this.player.stun() > 0){
        this.player.addStun(-1);
        return;
    }

    let n;
    const dialog = createAttackDialog();
    const stop = T.pause(-1);
    this.addTask(stop, true);
    this.add(dialog);
    while((n = this.checkInput(GE)) < 0){
        yield true;
    }
    dialog.active = false;
    stop.active = false;
    yield* this.attackPhase_choice(n);

    const pts = this.pool.chargedMP + this.player.MP();
    yield* this.SD.wait(60);
    this.poolView.frames = 60;
    this.pool.init();
    const obj = T.fader(T.slider(T.finite(
        T.text(`${pts} pts`, this.textOpt.points),
        60), this.poolView.x, this.poolView.y+50), 0);
    obj.slideTo(this.poolView.x, this.poolView.y+40, 2);
    obj.fadeTo(1, 2);
    this.add(obj);

    GE.se.play("hit0");  // 試しにSEを入れてみる
    this.enemy.addHP(-pts);
    this.shakeEnemy();  // shake_test
    yield* this.SD.wait(110);
},
*attackPhase_choice(n){
    if(n == 1){
        yield* this.SD.wait(30);
        this.poolView.frames = 45;
        this.pool.chargedMP = Math.floor(this.pool.chargedMP / 2);
        this.player.resetSG();
        yield* this.SD.wait(60);
    }
    if(n == 2){
        while(this.pool.skills.length > 0){
            yield* this.SD.wait(20);
            const skill = this.pool.skills.shift();
            this.add( createSkillDialog(skill) );
            yield* this.SD.wait(130);
            yield* this.SD.deal(GE, skill);
        }
    }
},

*defencePhase(GE, self){
    if(this.player.shield() > 0){
        this.add(new QBTalk("スキルのおかげで敵の攻撃を防げたみたいだ。", 100));
        this.player.addShield(-1);
        yield* this.SD.wait(50);
    }
    else{
        GE.se.play("hit1");  // 試しにSEを入れてみる
        this.shakePlayer();  // shaker_test
        this.player.addHP(-this.enemy.MP());
    }
    yield* this.SD.wait(90);
},

*ending(GE, self){
    const judge = this.judgement() ? "YOU WIN!" : "YOU LOSE";
    const obj = T.fader(
        T.text(judge, {x: 500, y: 320, ...this.textOpt.clear}), 0 );
    obj.fadeTo(1, 1);

    this.addSprite(obj);
    this.addTask(T.pause(-1), true );
    this.addTask(T.call((GE) => { GE.se.play("battleFinished"); } ), true );
    this.addTask(obj, true);
    this.addTask(T.pause(20), true);
    this.poolView.showOnlyCards = true;

    yield* this.SD.wait(20);
    let blinky = T.text("Press any button", {x: 500, y: 580, textAlign: "center", ...this.textOpt.score});
    blinky = T.scheduler(T.fader(blinky, 0));
    blinky.loop(40, (GE, obj) => {
        const t = 1 - obj.alpha;
        obj.fadeTo(t, 10-3*t); return true;
    });
    this.addSprite(blinky);
    this.addTask(blinky, true);

    yield* this.SD.wait(40);
    while(true){
        const i = this.checkInput(GE);
        if(i >= 0) GE.changeScene("intermediate");
        yield true;
    }
}
});

})(battle);
