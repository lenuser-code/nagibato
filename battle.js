/**
 * @file
 * namespace battleを定義し, その中にmainSceneを実装する.
 *
 * @author lenuser
 */

/**
 * mainSceneの構成要素をまとめたnamespace. 以下の要素が外部に公開される.
 * - battle.mainScene
 *
 * @namespace
 */
var battle = battle || {};
(function(battle){

// #1. SkillDealerBase, EnemyDealerBaseの派生クラス

/**
 * SkillDealerBaseのサブクラス. 上記クラスの内容を継承し, それに加えて,
 * プレイヤー側のスキルの実行時にスキルオブジェクトから呼び出される
 * 各種機能を具体的に実装する. 言い換えれば, スキル効果の実装作業において
 * mainSceneの中身を知らないと書けない処理がここに集められている.
 * @class
 * @extends SkillDealerBase
 */
let SkillDealer = class extends SkillDealerBase{
    #owner;
    #se;

    /**
     * ownerを使用してSkillDealerBaseの機能を実装するインスタンスを生成する.
     * @param {stdgam.Scene} owner - mainSceneへの参照
     * @param {stdgam.SEPool} se - SEの再生に使うSEPool
     */
    constructor(owner, se){
        super();
        this.#owner = owner;
        this.#se = se;
    }

    // サブクラスが実装する処理 (基本情報)

    enemyHP(){
        return this.#owner.enemy.HP();
    }

    // サブクラスが実装する処理 (攻撃時に実行)

    *addHP(percent){
        const v = this.#owner.player.percentHP(percent);
        this.#se.play("powerup");
        this.#owner.player.addHP(v);
        yield* this.wait(60);
        yield* this.playerChanged();
    }

    *addMP(percent){
        const v = this.#owner.player.percentMP(percent);
        this.#se.play("chargeUp");
        this.#owner.player.addMP(v);
        yield* this.wait(60);
    }

    *addSG(percent){
        this.#se.play("powerup");
        this.#owner.player.addSG(percent);
        yield* this.wait(60);
    }

    *addHPSG(percent){
        const v = this.#owner.player.percentHP(percent);
        this.#se.play("powerup");
        this.#owner.player.addHP(v);
        this.#owner.player.addSG(percent);
        yield* this.wait(60);
        yield* this.playerChanged();
    }

    *addShield(n){
        this.#owner.player.addShield(n);
    }

    *chargeUp(percent){
        this.#owner.poolManager.chargeUp(percent);
        this.#se.play("chargeUp");
        yield* this.wait(60);
    }

    *reduceEnemyMP(percent){
        const v = this.#owner.enemy.percentMP(percent);
        this.#owner.enemy.addMP(-v);
        yield* this.wait(60);
    }

    *suitSpecificBoost(str, mark, percent){
        let f = false;
        if(mark < PrimitiveSuits.length){
            MPBoostBySuit.primitive[mark] += percent;
            if(this.#owner.player.mark() == mark){
                const v = this.#owner.player.percentMP(percent);
                this.#owner.player.addMP(v);
                f = true;
            }
        }
        else{
            MPBoostBySuit.prismatic += percent;
            if(this.#owner.player.isPrismatic()){
                const v = this.#owner.player.percentMP(percent);
                this.#owner.player.addMP(v);
                f = true;
            }
        }

        const changed = this.#owner.poolManager.recalculate();
        if(f || changed) this.#se.play("chargeUp");
        yield* this.wait(60);
    }

    *damage(percent){
        const v = this.#owner.player.percentMP(percent);
        this.#se.play("hit0");  // 試しにSEを入れてみる
        this.#owner.enemy.addHP(-v);
        this.#owner.shakeEnemy();  // shake_test
        yield* this.wait(60);
    }

    *extendTime(n){
        this.#owner.maxTimeCount += n;
    }

    *timeWarp(){
        this.#owner.player.addHP(this.#owner.player.percentHP(100));
        this.#owner.player.addSG(100);
        this.#owner.turn = 1;
        yield* this.wait(60);
        this.#owner.add(T.finite(
            T.text(`Turn ${this.#owner.turn}`, {x: 500, y: 180, ...this.#owner.textOpt.turn}),
            90));
        yield* this.wait(90);
    }

    // 本当に1ターン目に戻す場合
    *realTimeWarp(){
        this.#owner.backupArgs.playerData.main = null;
        this.#owner.init();  // !?
        this.#owner.GE.changeScene("main", this.#owner.backupArgs);  // !?
    }

    // サブクラスが実装する処理 (ターン開始時に実行)

    *heal(percent){
        this.#owner.add(new QBTalk("体力が回復するよ。", 60));
        const v = this.#owner.player.percentHP(percent);
        this.#se.play("powerup");
        this.#owner.player.addHP(v);
        yield* this.wait(120);
        yield* this.playerChanged();
    }

    *SGHeal(percent){
        this.#owner.add(new QBTalk("ソウルジェムが浄化されるよ。", 60));
        this.#se.play("powerup");
        this.#owner.player.addSG(percent);
        yield* this.wait(120);
    }

    // サブクラスが実装する処理 (HPの変化に伴い呼び出される)

    *crisisBoostTask(percent){
        if(this.#owner.player.HP() <= 0) return; // 既に敗北しているときは省略
        const f = (this.#owner.player.retentionRateHP() <= 0.5);
        if(this.appliedCB == percent){
            if(percent > 0 && !f){
                // 適用中かつ条件から外れた
                this.#owner.player.addMP(-this.#owner.player.percentMP(percent));
                this.appliedCB = 0;
                if(percent > 0) yield* this.wait(60);
            }
        }
        else{
            if(f){
                //条件を満たしているが適用量がpercentでない
                const a = percent - this.appliedCB;
                this.#owner.player.addMP(this.#owner.player.percentMP(a));
                this.appliedCB = percent;
                if(a > 0) this.#se.play("chargeUp"); 
                if(a != 0) yield* this.wait(90);
            }
            else if(!f && this.appliedCB > 0){
                //条件を満たしていない
                this.#owner.player.addMP(-this.#owner.player.percentMP(this.appliedCB));
                yield* this.wait(60);
                this.appliedCB = 0;
            }
        }
    }
}

/**
 * EnemyActionDealerのサブクラス. 上記クラスの内容を継承し, それに加えて,
 * 敵の特殊行動の実行時にスキルオブジェクトから呼び出される各種機能を
 * 具体的に実装する. 言い換えれば, 敵の特殊行動の実装作業において
 * mainSceneの中身を知らないと書けない処理がここに集められている.
 * @class
 * @extends EnemyActionDealerBase
 */
let EnemyActionDealer = class extends EnemyActionDealerBase{
    #owner;
    #se;

    /**
     * ownerを使用してEnemyActionDealerBaseの機能を実装するインスタンスを生成する.
     * @param {Scene} owner - mainSceneへの参照
     * @param {stdgam.SEPool} se - SEの再生に使うSEPool
     */
    constructor(owner, se){
        super();
        this.#owner = owner;
        this.#se = se;
    }

    // サブクラスが実装する処理 (基本情報)

    turnCount(){
        return this.#owner.turn;
    }

    playerHP(){
        return this.#owner.player.HP();
    }

    // サブクラスが実装する処理 (*upkeep内で実行)

    *poison(percent){
        this.#owner.add(new QBTalk("敵スキルの効果でダメージを受けるよ。", 60));
        const v = this.#owner.player.percentHP(percent);
        this.#se.play("hit1");  // 試しにSEを入れてみる
        this.#owner.shakePlayer();  // shaker_test
        this.#owner.player.addHP(-v);
        yield* this.wait(120);
        yield* this.#owner.SD.playerChanged();
    }

    // サブクラスが実装する処理 (*specialAction内で実行)

    *common(action){
        yield* this.wait(20);
        this.#se.play("enemyAction");
        this.#owner.add( createSkillDialog(action) );
        yield* this.wait(130);
    }

    *antiskill(callback){
        const id = this.#owner.player.id();
        if(this.#owner.player.mainSkillCount() > 0 && this.#owner.enemy.antiskillContains(id)){
            const yesno = new QBYesNo("アンチスキルを使うかい？\nA → YES    S → No", 20);
            this.#owner.addSprite(yesno);
            this.#owner.addTask(yesno, true);
            while(yesno.active) yield true;
            if(yesno.result){
                this.#owner.add(new QBTalk("敵スキルを打ち消したよ。", 60));
                this.#owner.player.shiftMainSkill();
                yield* this.wait(100);
                callback();
            }
        }
    }

    *stun(n){
        this.#owner.player.addStun(n);
    }

    *damage(percent){
        const v = this.#owner.enemy.percentMP(percent);
        this.#se.play("hit1");
        this.#owner.shakePlayer();
        this.#owner.player.addHP(-v);
        yield* this.wait(60);
        yield* this.#owner.SD.playerChanged();
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
        if(this.#owner.player.mark() != mark){
            const v = this.#owner.player.percentMP(percent);
            this.#owner.player.addMP(-v);
        }

        // 複合属性に対して
        MPBoostBySuit.prismatic -= percent;
        if(MPBoostBySuit.prismatic < 0){
            MPBoostBySuit.prismatic = 0;
        }
        if(this.#owner.player.isPrismatic()){
            const v = this.#owner.player.percentMP(percent);
            this.#owner.player.addMP(-v);
        }
        yield* this.wait(60);
    }

    *transform(enemyName){
        const data = EnemyData[enemyName];
        this.#owner.backupArgs.enemyData = data; // 敵設定を上書き
        this.#owner.enemy.init(data, this.#owner.player.suitString());
        this.init(data.actions);
        yield* this.wait(60);
    }
}


// #2. プライベート関数・プライベートクラス

// (a) コンポーネントを生成する関数

/*
 * 以下, draw() and/or exeecute()を持ちSceneに登録して使うオブジェクトを
 * この項目では単にコンポーネントと呼ぶ.
 */

/**
 * @typedef {Task} createPhysicalButton_obj
 * @prop {function(stdgam.GameEngine, CanvasRenderingContext2D): void} draw - 1フレーム分の描画処理を行う
 * @prop {function(stdgam.GameEngine): void} execute - 1フレーム分のタスク処理を行う
 * @prop {number} x - 配置する位置のx座標
 * @prop {number} y - 配置する位置のy座標
 * @prop {boolean} isPressed - このボタンが押されている状態かどうか
 * @prop {boolean} active - (stdgam.Sceneの意味で) このオブジェクトが有効か
 */

/**
 * 筐体のボタンを表現するコンポーネントを生成する.
 * @param {number} x - 配置する位置のx座標
 * @param {number} y - 配置する位置のy座標
 * @param {string} key - どのキー入力に反応するか指定する
 * @param {string} label - ボタンに書かれる文字
 * @return {createPhysicalButton_obj} 生成されたコンポーネント
 */
let createPhysicalButton = function(x, y, key, label) {
    return {
        x: x, y: y, isPressed: false, active: true,
        draw(GE, ctx) {
            ctx.save();
            // 押されている間はボタンを少し下げて暗くする
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
            ctx.fillText(label, 0, 2);
            ctx.restore();
        },
        execute(GE){
            const fn = this.isPressed ? "isDown" : "isJustPressed";
            this.isPressed = !this.locked && GE.input[fn](key);
            return true;
        }
    };
}

/**
 * createMeter()で作られるMeterオブジェクトの値をバーで表示する
 * コンポーネントを生成する.
 * @param {string} caption - 表示する値の説明
 * @param {Meter} target - 観察対象のMeterオブジェクト
 * @param {number} x - 配置する位置のx座標
 * @param {number} y - 配置する位置のy座標
 * @param {number} len - バーの長さ
 * @param {flag} [reversed=false] - trueなら左端を基点に, falseなら右端を基点にする.
 * @return {Sprite} 生成されたコンポーネント
 */
let createMeterView = function(caption, target, x, y, len, reversed = false){
    return {
        x: x, y: y, active: true,
        draw(GE, ctx){
            ctx.save();
            ctx.fillStyle = "rgba(200,200,200,1)";
            ctx.fillRect(this.x-2,this.y-2, len+4, 24);
            ctx.fillStyle = "rgba(50,50,50,1)";
            ctx.fillRect(this.x, this.y, len, 20);

            const sv = target.startingPoint();
            if(sv > target.value){
                const svWidth = len * sv / target.max;
                const x = reversed ? (this.x + len - svWidth) : this.x;
                ctx.fillStyle = "rgb(250,50,0,0.5)";
                ctx.fillRect(x, this.y, svWidth, 20);
            }

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

/**
 * Deckの状態を表示するコンポーネントを生成する.
 * @param {Deck} target - 観察対象のDeckオブジェクト
 * @param {number} x - 配置する位置のx座標
 * @param {number} y - 配置する位置のy座標
 * @return {Sprite} 生成されたコンポーネント
 */
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

/**
 * 各ターンの制限時間を表示するコンポーネントを生成する.
 * @param {number} maxTimeCount - 制限時間の初期値
 * @param {number} x - 配置する位置のx座標
 * @param {number} y - 配置する位置のy座標
 * @return {Sprite} 生成されたコンポーネント
 */
let createTimeCount = function(maxTimeCount, x, y){
    const obj = T.scheduler(
        T.text(`${maxTimeCount}`, {x: x, y: y, font: "70px Sans-Serif", textAlign: "center"})
    );

    obj.currentCount = maxTimeCount;
    obj.after(1, (GE, obj) => {
        GE.se.play("tick");
        obj.loop(60, (GE, obj) => {
            GE.se.play("tick");
            if(obj.currentCount == 1) {
                obj.active = false;
                return false;
            }
            obj.text = String(--obj.currentCount);
            return true;
        });
    });
    return obj;
}

/**
 * プレイヤーの行動選択時に表示するダイアログを生成する.
 * 入力受付はmainSceneで行う.
 * @returns {stdtask.Ask} 生成されたコンポーネント
 */
let createAttackDialog = function(){
    const img = GE.caches.get("DIALOG");
    const obj = new stdtask.AcceptKey(["KeyA", "KeyS", "KeyD"]);
    obj.draw = function(GE, ctx){
        ctx.save();
        ctx.drawImage(img, 0, 0);
        ctx.fillStyle = "white";
        ctx.font = "bold 50px Serif";
        ctx.fillText("A：アタック", 120, 250);
        ctx.fillText("S：ＳＧ回復", 120, 340);
        ctx.fillText("D：スキル", 120, 430);
        ctx.restore();
    };
    return obj;
}

/**
 * スキルの内容を表示するダイアログを生成する.
 * @param {Object} skill - 表示するスキル
 * @returns {Sprite} 生成されたコンポーネント
 */
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


// (b) Player, Enemyを登録するための処理

/**
 * Playerオブジェクトを指定されたシーンに登録する. 具体的には,
 * (1) Playerが持つ各種のMeterオブジェクトをSceneのタスクリストに登録する.
 * (2) Playerの状態を観察・表示するコンポーネントを生成し, Sceneに追加する.
 * @param {stdgam.Scene} scene - この操作を実行されるSceneオブジェクト
 * @param {Player} player - 登録されるPlayerオブジェクト
 * @param {number} x - 配置作業の基点のx座標
 * @param {number} y - 配置作業の基点のy座標
 */
let bindPlayer = function(scene, player, x, y){
    const nameView = T.text(player.name(), {x: x, y: y+90, font: "27px Sans-Serif"});

    const HPMeterView = createMeterView("HP", player.HPMeter, x, y, 750);
    const HPView = T.ftext("HP: ${}", player.HPMeter, "value",
                          {x: x, y: y-70, font: "27px Sans-Serif"});
    const MPView = T.ftext("MP: ${}", player.MPMeter, "value",
                          {x: x, y: y-30, font: "27px Sans-Serif"});
    const SGMeterView = createMeterView("SG", player.SGMeter, x, y+35, 750);

    scene.add(player.HPMeter);
    scene.add(player.MPMeter);
    scene.add(player.SGMeter);
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

    scene.pShaker = new Shaker(4, 2, 3);
    scene.pShaker.add(nameView, HPMeterView, HPView, MPView, shieldView, SGMeterView);
}

/**
 * Enemyオブジェクトを指定されたシーンに登録する. 具体的には,
 * (1) Enemyが持つ各種のMeterオブジェクトをSceneのタスクリストに登録する.
 * (2) Enemyの状態を観察・表示するコンポーネントを生成し, Sceneに追加する.
 * @param {stdgam.Scene} scene - この操作を実行されるSceneオブジェクト
 * @param {Enemy} enemy - 登録されるEnemyオブジェクト
 * @param {number} x - 配置作業の基点のx座標
 * @param {number} y - 配置作業の基点のy座標
 */
let bindEnemy = function(scene, enemy, x, y){
    scene.add(enemy.HPMeter);
    scene.add(enemy.MPMeter);
    const nameView = T.text(enemy.name(), {x: x+740, y: y-10, font: "27px Sans-Serif", textAlign: "right"});

    const HPView = T.ftext("HP: ${}", enemy.HPMeter, "value", {x: x+600, y: y+70, font: "27px Sans-Serif"});
    const MPView = T.ftext("MP: ${}", enemy.MPMeter, "value", {x: x+600, y: y+110, font: "27px Sans-Serif"});
    const HPMeterView = createMeterView("HP", enemy.HPMeter, x, y, 750, true);
    scene.add(nameView);
    scene.add(HPMeterView);
    scene.add(HPView);
    scene.add(MPView);

    scene.eShaker = new Shaker(4, 2, 3);
    scene.eShaker.add(nameView, HPView, MPView, HPMeterView);
}


// (c) mainScene内で使うヘルパー

/**
 * 登録されたオブジェクト達を一括で振動させるために使うクラス.
 * ターゲットの x 属性を直接変化させるので注意.
 * @class
 * @prop active - (stdgam.Sceneの意味で) このオブジェクトが有効か
 */
let Shaker = class{
    #speed;
    #v0;
    #v;
    #acc;
    #a;
    #dir;
    #count;
    #n;
    #target;
    #backup;

    /**
     * 指定された値を既定値とするインスタンスを生成する.
     * @param {number} speed - 振動の初期速度の既定値
     * @param {number} acc - 加速度の既定値
     * @param {number} count - 振動の回数 (半周期を1回とする) の既定値
     */
    constructor(speed, acc, count){
        this.#speed = speed;
        this.#acc = acc;
        this.#count = count;
        this.#target = [];
    }

    /**
     * 指定されたオブジェクトを対象に追加する.
     * ただし, 重複チェックは行わない.
     * @param {...Object} objs - 追加するオブジェクト
     */
    add(...objs){
        this.#target.push(...objs);
    }

    /**
     * 指定された設定で振動処理を初期化する.
     * もし省略されたりnullを与えられた要素は既定値を使う.
     * @param {number} [speed=null] - 振動の初期速度
     * @param {number} [acc=null] - 加速度
     * @param {number} [count=null] - 振動の回数 (半周期を1回とする) 
     */
    activate(speed = null, acc = null, count = null){
        this.#backup = this.#target.map((e) => e.x);
        this.#dir = 1;
        this.#v0 = this.#v = speed || this.#speed;
        this.#a = acc ? -acc : -this.#acc;
        this.#n = count || this.#count;
        this.active = true;
    }

    /**
     * 1フレーム分のタスク処理を実行する.
     * @param {stdgam.GameEngine} GE - このタスク処理に用いるGameEngine
     */
    execute(GE){
        if(this.#n <= 0){
            this.active = false;
            for(let i = 0; i < this.#target.length; i++){
                this.#target[i].x = this.#backup[i];
            }
            return true;
        }

        for(const obj of this.#target){
            obj.x += this.#v;
        }

        this.#v += this.#a;
        if(this.#v0 + this.#v * this.#dir <= 0){
            this.#dir *= -1;
            this.#a *= -1;
            this.#n--;
        }

        return true;
    }
}

/**
 * Poolの管理を行うオブジェクト.
 * @prop {number} x - 配置する位置のx座標
 * @prop {number} y - 配置する位置のy座標
 * @prop {boolean} showOnlyCard - trueならカードだけを表示する
 * @prop {boolean} active - (stdgam.Sceneの意味で) このオブジェクトが有効か
 */
class PoolManager{
    #owner;
    #pool;
    #meter;
    #step = 15;
    #chainFont = { font: "bold 24px Sans-Serif", color: "#ffff55" };
    #damageFont = { color: "orange", font: "bold 36px Sans-Serif" };
    #statusFont = { font: "24px Sans-Serif", color: "white" };

    #addChainEffect(){
        const x = this.x + this.#pool.size() * this.#step - 15;
        const text = T.text("COMBO!", this.#chainFont);
        const spr = T.slider(T.finite(text, 20), x, this.y-15);
        spr.slideTo(x, this.y-20, 15);
        this.#owner.add(spr);
    }

    #addAttackEffect(dmg){
        const text = T.text(`${dmg} pts`, this.#damageFont);
        const obj = T.fader(T.slider(T.finite(text, 60), this.x, this.y+50), 0);
        obj.slideTo(this.x, this.y+40, 2);
        obj.fadeTo(1, 2);
        this.#owner.add(obj);
    }

    /**
     * 指定された設定でインスタンスを生成する.
     * @param {stdgam.Scene} owner - このオブジェクトを使用するシーン
     * @param {number} version - Poolに渡す引数
     * @param {number} x - 配置する位置のx座標
     * @param {number} y - 配置する位置のy座標
     */
    constructor(owner, version, x, y){
        this.#owner = owner;
        this.#pool = new Pool(version);
        this.#meter = new stdtask.Meter(0, 9999, 10);
        owner.add(this.#meter);
        this.x = x;
        this.y = y;
        this.showOnlyCards = false;
        this.active = true;
    }

    /** @returns {number[]} 次のカードを配置する座標.*/
    addr(){
        return {x: this.x + this.#pool.size() * this.#step, y: this.y};
    }

    /**
     * チャージボーナスの加算処理を行う.
     * @param {number} percent - 加算するチャージボーナス
     */
    chargeUp(percent){
        this.#pool.addChargeBonus(percent);
        this.#meter.changeTo(this.#pool.chargedMP(), 45);
    }

    /**
     * 指定されたカードを場に出す処理を行う.
     * @param {Cardlike} card - 場に出すカード
     */
    putCard(card){
        this.#pool.push(card);
        this.#meter.changeTo(this.#pool.chargedMP());
        if(this.#pool.hyped()){
            this.#addChainEffect();
        }
    }

    /**
     * MPBoostBySuitの変更時に, MPの再計算処理を行う.
     * @returns {boolean} MPに変化があった場合true, そうでなければfalse
     */
    recalculate(){
        const tmp = this.#pool.chargedMP();
        this.#pool.recalculate();
        return (this.#pool.chargedMP() != tmp);
    }

    /**
     * 追加スキャンの処理を行う.
     * param {Cardlike} card - 追加スキャンするカード
     */
    extraScan(card){
        this.#pool.extraScan(card);
        this.#meter.changeTo(this.#pool.chargedMP());
        if(this.#pool.hyped()){
            this.#addChainEffect();
        }
    }

    /**
     * チャージMPの選択肢補正を0.5にする.
     */
    halveMP(){
        this.#pool.setCorrectionFlag(true);
        this.#meter.changeTo(this.#pool.chargedMP(), 45);
    }

    /**
     * チャージMPをplayerMPに加算した値を返す. このとき同時にチャージMPを0にする.			
     * @param {number} playerMP - プレイヤーのMP
     * @returns playerMPにチャージMPを加算した値
     */
    consumeMP(playerMP){
        const MP = this.#pool.chargedMP() + playerMP;
        this.#addAttackEffect(MP);
        this.#pool.init();
        this.#meter.changeTo(this.#pool.chargedMP(), 60);
        return MP;
    }

    /**
     * スキル発動処理を行うジェネレータを生成する.
     * @param {stdgam.GameEngine} GE - この処理に用いるGameEngine
     */
    *invokeSkills(GE){
        while(this.#pool.skillCount() > 0){
            yield* this.#owner.SD.wait(20);
            GE.se.play("skill");
            const skill = this.#pool.shiftSkill();
            this.#owner.add( createSkillDialog(skill) );
            yield* this.#owner.SD.wait(130);
            yield* this.#owner.SD.deal(GE, skill);
        }
    }

    /**
     * 現在の状態を描画する.
     * @param {stdgam.GameEngine} GE - この処理に用いるGameEngine
     * @param {CanvasRenderingContext2D} ctx - 描画に用いるコンテクスト
     */
    draw(GE, ctx){
        ctx.save();
        for(let i = 0; i < this.#pool.size(); i++){
            const x = this.x + i * this.#step;
            this.#pool.watch(i).paint(GE, ctx, x, this.y);
        }
        if(!this.showOnlyCards){
            ctx.font = this.#statusFont.font;
            ctx.fillStyle = this.#statusFont.color;
            ctx.fillText(`MP: ${this.#meter.value}`, this.x, this.y + Card.height + 30);
            if(this.#pool.skillCount() > 0){
                ctx.fillText(
                    `スキル×${this.#pool.skillCount()}`,
                    this.x + 135, this.y + Card.height + 30
                );
            }
        }
        ctx.restore();
    }
}

/**
 * 手札とデッキの管理を行うオブジェクト.
 * 手札やデッキをカプセル化しつつ必要な情報を外部に提供する.
 * 加えて, 「デッキからカードを引く」「手札を場に出す」という処理の実装を担当する.
 * @prop {boolean} busy - 手札からpoolへカードが移動中ならばtrue, そうでなければfalse
 */
class HandManager{
    #owner;
    #deck;
    #hand;
    #poolManager;
    #deckpos;

    /**
     * ownerの手札・デッキを管理するインスタンスを生成する.
     * @param {stdgam.Scene} owner - このオブジェクトを所有するシーン
     * @param {Deck} deck - 使用するDeckオブジェクト
     * @param {PoolManager} poolManager - このシーンのPoolを管理しているPoolManager
     */
    constructor(owner, deck, poolManager){
        this.#owner = owner;
        this.#deck = deck;
        this.#hand = [];
        this.#poolManager = poolManager;
        this.#deckpos = { x: owner.position.deck[0], y: owner.position.deck[1] };
        this.busy = false;

        for(let i = 0; i < 3; i++){
            const [tx, ty] = owner.position.hand(i);
            const obj = T.custom(Card.NullCard, { x: tx, y: ty });
            this.#hand.push(obj);
            owner.add(obj);
        }
    }

    /**
     * すべてのカードを使い切ったか調べる.
     * @returns 手札もデッキも空のときtrue, そうでないときfalse
     */
    allCardsSpent(){
        return this.#deck.size() == 0 && this.#hand.every((e) => e.contents.value == 0);
    }

    /**
     * n番目の手札のコストを返す. nは0から数え始める.
     * @param {number} n - 確認したい手札のインデックス
     */
    cost(n){
        return this.#hand[n].contents.value;
    }

    /**
     * デッキから1枚カードを引き、「そのカードを適切な位置に移動した後,
     * n番目の手札にセットする」という操作を実行するタスクオブジェクトを生成する.
     * nは0から数え始める.
     * @param {number} n - 何番目の手札にセットするか指定する
     * @returns {Task} カードの移動と手札セットを実行するタスクオブジェクト
     */
    drawCard(n){
        return this.#delivery(this.#deck.shift(), this.#deckpos, this.#hand[n],
            (card) => { this.#hand[n].contents = card; }
        );
    }

    /**
     * 「n番目の手札を適切な位置に移動した後, poolに出す」という操作を実行する
     * タスクオブジェクトを生成する. 同時にn番目の手札を空にする.
     * nは0から数え始める.
     * @param {number} n - 何番目の手札をpoolに出すか指定する
     * @returns {Task} カードの移動とpoolへ出す処理を実行するタスクオブジェクト
     */
    playCard(i){
        const card = this.#hand[i].contents;
        this.#hand[i].contents = Card.NullCard;
        this.busy = true;
        return this.#delivery(card, this.#hand[i], this.#poolManager.addr(),
            (card) => {
                this.#poolManager.putCard(card);
                this.busy = false;
            }
        );
    }

    /**
     * ある場所から他の場所までカードが移動する様子を描画した後, 指定された処理を
     * 実行するオブジェクトを生成する.
     * @param {Card} card - 対象となるカード
     * @param {{x: number, y: number}} addr1 - 移動開始時の位置
     * @param {{x: number, y: number}} addr2 - 移動終了時の位置
     * @param {function} callback - 移動終了時に実行する関数. cardを引数として受け取る.
     * @returns {Object} 生成されたオブジェクト
     */
    #delivery = function(card, addr1, addr2, callback){
        const obj = T.scheduler( T.slider(T.custom(card), addr1.x, addr1.y) );
        obj.slideTo(addr2.x, addr2.y, 18);
        obj.after(18, (GE, obj) => {
            callback(card);
            obj.active = false;
        });
        return obj;
    }
}


// #3. mainSceneの実装

/**
 * バトルを実行するSceneオブジェクト.
 * @type {stdgam.Scene}
 * @namespace
 * @prop {Object.<string,*>} position - 位置情報を抽出したもの
 * @prop {Object.<string, Object.<string, *>>} textOpt - テキスト描画に用いるオプションをまとめたもの
 * @prop {Deck} sideboard - サイドボードを格納しているDeckオブジェクト
 * @prop {Object.<string, *>} backupArgs - オプションリストのバックアップ
 * @prop {number} maxTimeCount - 各ターンの制限時間の秒数
 * @prop {number} turn - 現在のターン数
 * @prop {number} QBChance - QBチャンスの残り回数
 * @prop {Player} player - バトルしているプレイヤーキャラクター
 * @prop {Enemy} enemy - バトルしている敵キャラクター
 * @prop {Shaker} pShaker - プレイヤー側UIのためのShaker
 * @prop {Shaker} eShaker - 敵側UIのためのShaker
 * @prop {PoolManager} poolManager - Poolの管理に使用するPoolManager
 * @prop {HandManager} handManager - 手札とデッキの管理に使用するHandManager
 * @prop {SkillDealerBase} SD - プレイヤースキルの実行を担当するオブジェクト
 * @prop {EnemyActionDealerBase} EAD - 敵スキルの実行を担当するオブジェクト
 */
battle.mainScene = new stdgam.Scene({
/**
 * 位置情報を抽出したもの.
 * @type {Object.<string,*>}
 * @memberof battle.mainScene
 */
position: {
    x: 160,  y: 0,
    rel(dx, dy){ return [this.x + dx, this.y + dy]; },
    init(){
        this.deck = this.rel(440, 350);
        this.pool = this.rel(70, 150);
        this.timer = this.rel(-70, 120);
        this.player = this.rel(-120, 550);
        this.enemy = this.rel(50, 60);
        this.hand = (i) => this.rel(100+i*(5+Card.width), 350);
        this.button = (i) => this.rel(100+i*(5+Card.width)+Card.width/2, 500);
    }
},

/**
 * テキスト描画に用いるオプションをまとめたもの.
 * @type {Object.<string, Object.<string, *>>}
 * @memberof battle.mainScene
 */
textOpt: {
    time: { font: "27px Sans-Serif", textAlign: "center" },
    score: { font: "27px Sans-Serif" },
    turn: { font: "80px Serif", textAlign: "center" },
    acceptTurnEnd: { font: "27px Sans-Serif", textAlign: "right"},
    points: { color: "orange", font: "bold 36px Sans-Serif" },
    clear: { color: "yellow", font: "bold 100px Serif", textAlign: "center" }
},

/**
 * プレイヤー側のUIを振動させる.
 * @memberof battle.mainScene
 */
shakePlayer(){
    if(this.pShaker.active) return;
    this.pShaker.activate();
    this.addTask(this.pShaker);
},

/**
 * 敵側のUIを振動させる.
 * @memberof battle.mainScene
 */
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

/**
 * A, S, Dのキーが押されたか確認し, 該当するキーがあれば
 * そのうち一番優先順序の高いキーのインデックスを返す.
 * 優先順序は上記の並び順の通りであり, インデックスはAを0番目とした数字である.
 * どれも押されていなかったときは-1を返す.
 * @param {stdgam.GameEngine} GE - 使用するGameEngine
 * @returns {number} 押されたキーがあればそのうち一番優先されるキーのインデックス.
 * そうでなければ-1
 * @memberof battle.mainScene
 */
checkInput(GE){
    const codes = ["KeyA", "KeyS", "KeyD"];
    return GE.input.checkInput(codes)[1];
},

/**
 * 残り体力に基づく勝敗判定を行う.
 * @returns {boolean} プレイヤーが勝利していればtrue, そうでなければfalse
 * @memberof battle.mainScene
 */
judgement(){
    if(this.enemy.HP() == 0) return true;
    if(this.player.HP() == 0) return false;
    return (this.player.retentionRateHP() >= this.enemy.retentionRateHP());
},

/**
 * このシーンの構成要素を初期化する.
 * @param {stdgam.GameEngine} GE - このシーンをロードしたGameEngine
 * @param {Object.<string, *>} args - このシーンに渡されたオプションリスト
 * @memberof battle.mainScene
 */
initComponents(GE, args){
    this.position.init();
    this.sideboard = args.sideboard;
    
    const version = args.chainRule != 2 ? 1 : 2;
    this.poolManager = new PoolManager(this, version, ...this.position.pool);
    this.handManager = new HandManager(this, args.deck, this.poolManager);
    this.turn = 0;
    this.QBChance = (args.QBChance ? 1 : 0);
    this.maxTimeCount = 5;

    this.SD = new SkillDealer(this, GE.se);
    this.EAD = new EnemyActionDealer(this, GE.se);

    this.player = new Player(args.playerData);
    this.enemy = new Enemy(args.enemyData || EnemyData["キュゥべえ"], args.playerData.suit_string);
    this.EAD.init( args.enemyData ? args.enemyData.actions : []);
},

/**
 * ロード時に渡されたオプションリストのバックアップをとる.
 * ただし, このbackupは稀に改変される可能性がある.
 * @param {Object.<string, *>} args - このシーンに渡されたオプションリスト
 * @memberof battle.mainScene
 */
backupOptions(args){
    this.backupArgs = {...args};

    // 一部のデータはディープコピーをとる
    this.backupArgs.deck = args.deck.clone();
    this.backupArgs.sideboard = args.sideboard.clone();
    this.backupArgs.playerData = {...args.playerData};
    this.backupArgs.enemyData = (args.enemyData ? {...args.enemyData} : null);
},

/**
 * シーンがロードされた時に実行される初期化処理.
 * @param {stdgam.GameEngine} GE - このシーンをロードしたGameEngine
 * @param {Object.<string, *>} args - このシーンに渡されたオプションリスト
 * @memberof battle.mainScene
 */
onLoad(GE, args){
    MPBoostBySuit.init();
    this.init();
    this.add(T.image(GE.caches.get("BACKGROUND"), {x: 0, y: 0}));
    this.add(T.image(GE.caches.get("CARDMAT"), {x: 0, y: 0}));

    this.backupOptions(args);
    this.initComponents(GE, args);

    const btnLabels = ["A", "S", "D"];
    const btnKeys = ["KeyA", "KeyS", "KeyD"];
    for (let i = 0; i < 3; i++) {
        // 手札のカードの中心（Card.width/2）に合わせる
        const [bx, by] = this.position.button(i);
        this.add(createPhysicalButton(bx, by, btnKeys[i], btnLabels[i]));
    }

    bindPlayer(this, this.player, ...this.position.player);
    bindEnemy(this, this.enemy, ...this.position.enemy);

    this.add(this.poolManager);
    this.addSprite(createDeckView(args.deck, ...this.position.deck));
    this.useCoroutine(GE, this.chart);
},

*chart(GE, opt){
    yield* stdtask.wait(10);
    yield* this.firstDeal(GE, this);
    while(this.turn <= 4 && this.player.HP() > 0){
        // アップキープの処理
        yield* this.phase1(GE, this);
        yield* this.SD.upkeep(GE);
        yield* this.EAD.upkeep(GE);
        if(this.player.HP() <= 0 || this.enemy.HP() <= 0) break;

        // QBチャンス
        if(this.turn == 2 && this.QBChance > 0) yield* this.QBChanceProcess(GE, this);

        // メインスキル
        yield* this.mainSkill(GE, this);
        if(this.player.HP() <= 0 || this.enemy.HP() <= 0) break;

        // 追加スキャン
        yield* this.extraScan(GE, this);
        if(this.player.HP() <= 0 || this.enemy.HP() <= 0) break;

        // 敵スキル
        yield* this.EAD.specialAction(GE);
        if(this.player.HP() <= 0 || this.enemy.HP() <= 0) break;

        // メイン
        yield* this.phase2(GE, this);
        yield* this.waitWhileBusy(GE, this);
        yield* this.attackPhase(GE, this);
        if(this.player.HP() <= 0 || this.enemy.HP() <= 0) break;
        yield* this.defencePhase(GE, this);
    }
    yield* this.ending(GE, this);
},

*firstDeal(GE, self){
    const openingQB = createOpeningQB(this.backupArgs);
    this.addSprite(openingQB);
    this.addTask(openingQB, true);

    for(let i = 0; i < 3; i++){
        const obj = T.pause(60);
        const d = this.handManager.drawCard(i);
        this.addTaskAfter(this.openingQB, obj);
        this.addTask(d, true);
        this.addSprite(d, false);
        while(obj.active) yield true;
    }

    while(openingQB.active) yield true;
},

*phase1(GE, self){
    this.turn++;
    this.add(T.finite(
        T.text(`Turn ${this.turn}`, {x: 500, y: 180, ...this.textOpt.turn}),
        90));
    yield* stdtask.wait(90);
},

*QBChanceProcess(GE, self){
    const QB = new QBSlideIn("キュゥべえチャンス", 200, 20);
    this.addSprite(QB);
    this.addTask(QB, true);

    const effects = [
        [this.player, "addHP", this.player.percentHP(5), "powerup"],
        [this.player, "addMP", this.player.percentMP(5), "powerup"],
        [this.enemy, "addHP", -this.player.percentMP(10), "hit0"]
    ];
    yield* stdtask.wait(20);
    const op = effects[Math.floor(Math.random() * effects.length)];
    op[0][op[1]](op[2]);
    GE.se.play(op[3]);

    this.QBChance--;
    while(QB.active) yield true;
},

*mainSkill(GE, self){
    if(this.player.mainSkillCount() <= 0) return;
    const yesno = new QBYesNo("メインスキルを使うかい？\nA → YES    S → No", 20);
    this.addSprite(yesno);
    this.addTask(yesno, true);
    while(yesno.active) yield true;

    if(yesno.result){
        const mainSkill =  this.player.shiftMainSkill();
        yield* stdtask.wait(20);
        GE.se.play("skill");
        this.add( createSkillDialog(mainSkill) );
        yield* stdtask.wait(130);
        yield* this.SD.deal(GE, mainSkill);
    }
},

*extraScan(GE, self){
    if(!this.handManager.allCardsSpent() || this.sideboard.size() == 0) return;
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
            this.poolManager.extraScan(card);
            yield* stdtask.wait(60);
        }
    }
},

*phase2(GE, self){
    yield* stdtask.wait(10);

    if(this.player.stun() > 0){
        this.add(new QBTalk("行動を封じられて動けない！", 100));
        const [x, y] = this.position.rel(-110, 60);
        this.add(T.finite(T.text("STUN!", {x: x, y: y, font: "32px Sans-Serif"}), 120));
        yield* stdtask.wait(120);
        return;
    }

    const timer = createTimeCount(this.maxTimeCount, ...this.position.timer);
    const [tx, ty] = this.position.rel(-70, 50);
    this.add(timer);
    this.add(T.finite(T.text("TIME", {x: tx, y: ty, ...this.textOpt.time}), 300));

    const acceptTurnEnd = T.finite(T.text(
        "Space：ターン終了", {x: 950, y: 650, ...this.textOpt.acceptTurnEnd}), 300);
    acceptTurnEnd.execute = function(GE){
        if(GE.input.isJustPressed("Space")){
            timer.active = false;
            this.active = false;
        }
        return true;
    };
    this.add(acceptTurnEnd);

    while(timer.active){
        this.phase2_body(GE, this.checkInput(GE));
        yield true;
    }
},
phase2_body(GE, i){
    if(i >= 0 && !this.handManager.busy && this.handManager.cost(i) != 0){
        if(!this.player.payCost(this.handManager.cost(i))){
            this.add(new QBTelop("ソウルジェムが濁っているよ"));
            return;
        }
        this.add( this.handManager.playCard(i) );
        this.add( this.handManager.drawCard(i) );
    }
},

*waitWhileBusy(GE, self){
    while(this.handManager.busy) yield true;
    yield* stdtask.wait(60);
},

*attackPhase(GE, self){
    if(this.player.stun() > 0){
        this.player.addStun(-1);
        return;
    }

    const dialog = createAttackDialog();
    const n = yield* dialog.addAndWait(this);

    yield* this.attackPhase_choice(GE, n);
    yield* stdtask.wait(60);

    const damage = this.poolManager.consumeMP(this.	player.MP());
    GE.se.play("hit0");  // 試しにSEを入れてみる
    this.enemy.addHP(-damage);
    this.shakeEnemy();  // shake_test
    yield* stdtask.wait(110);
},
*attackPhase_choice(GE, n){
    if(n == 1){
        yield* stdtask.wait(30);
        this.poolManager.halveMP();
        GE.se.play("powerup");
        this.player.resetSG();
        yield* stdtask.wait(60);
    }
    if(n == 2){
        yield* this.poolManager.invokeSkills(GE);
    }
},

*defencePhase(GE, self){
    if(this.player.shield() > 0){
        GE.se.play("shield");
        this.add(new QBTalk("スキルのおかげで敵の攻撃を防げたみたいだ。", 100));
        this.player.addShield(-1);
        yield* stdtask.wait(50);
    }
    else{
        GE.se.play("hit1");  // 試しにSEを入れてみる
        this.shakePlayer();  // shaker_test
        this.player.addHP(-this.enemy.MP());
    }
    yield* stdtask.wait(90);
},

*ending(GE, self){
    const judge = this.judgement() ? "YOU WIN!" : "YOU LOSE";
    const obj = T.fader(
        T.text(judge, {x: 500, y: 320, ...this.textOpt.clear}), 0 );
    obj.fadeTo(1, 1);

    this.addSprite(obj);
    this.addTask(T.pause(-1), true);
    this.addTask(T.call((GE) => { GE.se.play("battleFinished"); } ), true );
    this.addTask(obj, true);
    this.addTask(T.pause(20), true);
    this.poolManager.showOnlyCards = true;

    yield* stdtask.wait(20);
    let blinky = T.text("Press any button", {x: 500, y: 580, textAlign: "center", ...this.textOpt.score});
    blinky = T.scheduler(T.fader(blinky, 0));
    blinky.loop(40, (GE, obj) => {
        const t = 1 - obj.alpha;
        obj.fadeTo(t, 10-3*t); return true;
    });
    this.addSprite(blinky);
    this.addTask(blinky, true);

    yield* stdtask.wait(40);
    while(true){
        const i = this.checkInput(GE);
        if(i >= 0) GE.changeScene("intermediate");
        yield true;
    }
}
});

})(battle);
