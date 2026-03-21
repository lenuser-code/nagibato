/**
 * @file
 * システムメッセージを表示するオブジェクトの実装を行う.
 * また, これらのオブジェクトを生成するヘルパー関数も用意する.
 *
 * @author lenuser
 */


// #1. システムメッセージを表示するオブジェクト

/**
 * 時間経過で消える会話ダイアログのクラス.
 * @class
 */
class QBTalk{
    constructor(msg, frames = 120){
        this.a = 10;
        this.y = 700;
        this.step = 40;
        this.activate(msg, frames);
    }

    activate(msg, frames = 120){
        this._y = this.y
        this.frames = frames;
        this.lines = msg.split("\n");
        this.iter = this.chart.call(this, this);
        this.active = true;
    }

    draw(GE, ctx){
        ctx.save();
        ctx.fillStyle = "rgb(0,0,0,0.5)";
        ctx.fillRect(0, this._y, 1000, 300);

        ctx.fillStyle = "white";
        ctx.font = "30px Sans-Serif";
        for(let i = 0; i < this.lines.length; i++){
            ctx.fillText(this.lines[i], 40, this._y + 50 + i * this.step);
        }
        ctx.restore();
    }

    execute(GE){
        const result = this.iter.next();
        if(result.done) this.active = false;
        return true;
    }

    *chart(){
        let i;
        for(i = 0; i < 20; i++){ this._y -= this.a; yield true; }
        for(i = 0; i < this.frames; i++) yield true;
        for(i = 0; i < 20; i++){ this._y += this.a; yield true; }
    }
}

/**
 * 画面中央に一定時間表示されるメッセージのクラス.
 * @class
 */
class QBTelop{
    constructor(msg, frames = 20){
        this.a = (1 / 15);
        this.step = 40;
        this.activate(msg, frames);
    }

    activate(msg, frames = 20){
        this._alpha = 0;
        this.frames = frames;
        this.lines = msg.split("\n");
        this.iter = this.chart.call(this);
        this.active = true;
    }

    draw(GE, ctx){
        ctx.save();
        ctx.globalAlpha = Math.max(this._alpha, 0);
        ctx.fillStyle = "white";
        ctx.font = "32px Sans-Serif";
        ctx.textAlign = "center";
        const y = 350 - this.lines.length * this.step/2;
        for(let i = 0; i < this.lines.length; i++){
            ctx.fillText(this.lines[i], 500, y + i * this.step);
        }
        ctx.restore();
    }

    execute(GE){
        const result = this.iter.next(this);
        if(result.done) this.active = false;
        return true;
    }

    *chart(){
        let i;
        for(i = 0; i < 15; i++){ this._alpha += this.a; yield true; }
        for(i = 0; i < this.frames; i++) yield true;
        for(i = 0; i < 15; i++){ this._alpha -= this.a; yield true; }
    }
}

/**
 * ユーザーに入力を要求する会話ダイアログのクラス.
 */
class QBYesNo{
    constructor(msg, minWait = 20, seName = null){
        this.a = 10;
        this.y = 700;
        this.step = 40;
        this.seName = seName;
        this.activate(msg, minWait);
    }

    activate(msg, minWait = 20){
        this._y = this.y
        this.busy = minWait;
        this.lines = msg.split("\n");
        this.iter = this.chart.call(this, this);
        this.result = false;
        this.active = true;
    }

    draw(GE, ctx){
        ctx.save();
        ctx.fillStyle = "rgb(0,0,0,0.5)";
        ctx.fillRect(0, this._y, 1000, 300);

        ctx.fillStyle = "white";
        ctx.font = "30px Sans-Serif";
        for(let i = 0; i < this.lines.length; i++){
            ctx.fillText(this.lines[i], 40, this._y + 50 + i * this.step);
        }
        ctx.restore();
    }

    execute(GE){
        this.GE = GE;
        const result = this.iter.next();
        this.GE = null;
        if(result.done) this.active = false;
        return false;
    }

    *chart(){
        let i;
        for(i = 0; i < 20; i++){ this._y -= this.a; this.busy--; yield false; }
        yield* this.waitForAnswer();
        for(i = 0; i < 20; i++){ this._y += this.a; yield false; }
    }

    *waitForAnswer(){
        let f = true;
        while(f){
            const codes = ["KeyA", "KeyS"];
            const i = codes.findIndex((e) => this.GE.input.isJustPressed(e));
            if(this.busy > 0) this.busy--;
            else{
                if(i >= 0){
                    this.result = (i == 0);
                    if(this.seName && this.result) this.GE.se.play(this.seName);
                    f = false;
                }
            }
            yield false;
        }
    }
}

/**
 * 複数のメッセージを順番に表示する会話ダイアログのクラス.
 * @class
 */
class QBLecture{
    constructor(msgs, minWait=20){
        this.a = 10;
        this.y = 700;
        this.step = 40;
        this.activate(msgs, minWait);
    }

    activate(msgs, minWait=30){
        this._y = this.y
        this.messages = [...msgs];
        this.lines = [];
        this.minWait = minWait;
        this.busy = 0;

        this.iter = this.chart.call(this);
        this.active = true;
    }

    draw(GE, ctx){
        ctx.save();
        ctx.fillStyle = "rgb(0,0,0,0.5)";
        ctx.fillRect(0, this._y, 1000, 300);

        ctx.fillStyle = "white";
        ctx.font = "30px Sans-Serif";
        for(let i = 0; i < this.lines.length; i++){
            ctx.fillText(this.lines[i], 40, this._y + 50 + i * this.step);
        }
        if(this._y <= this.y - this.a*20){
            ctx.font = "20px Sans-Serif";
            ctx.fillText("▼NEXT", 850, 660);
        }
        ctx.restore();
    }

    execute(GE){
        this.GE = GE;
        const result = this.iter.next();
        this.GE = null;
        if(result.done) this.active = false;
        return true;
    }

    *chart(){
        let i;
        for(i = 0; i < 20; i++){ this._y -= this.a; yield true; }
        yield* this.talk();
        for(i = 0; i < 20; i++){ this._y += this.a; yield true; }
    }

    *talk(){
        while(this.nextPage()){
            let f = true;
            while(f){
                const codes = ["KeyA", "KeyS", "KeyD"];
                const i = codes.findIndex((e) => this.GE.input.isJustPressed(e));
                if(this.busy > 0) this.busy--;
                if(this.busy == 0 && i >= 0) f = false;
                yield true;
            }
        }
    }

    nextPage(){
        if(this.messages.length == 0) return false;
        const msg = this.messages.shift();
        this.lines = msg.split("\n");
        this.busy = this.minWait;
        return true;
    }
}


// #2. ヘルパー関数, チュートリアルデータ

// (a) ヘルパー関数

/*
 * テキスト量の多いメッセージはこのファイルでまとめて管理する.
 * (短い＆分岐が無いものは別のファイルにそのまま埋め込まれているけど)
 */

/**
 * バトルの最初にQBが喋る内容を生成する.
 * @param {Objcet.<string,*>} battleOpt - バトルの設定データ
 */
const createOpeningQB = function(battleOpt){
    // チュートリアルの場合
    if(battleOpt.tutorial){
        return new QBLecture(battleOpt.tutorial);
    }

    // 予行練習の場合
    if(!battleOpt.enemyData){
        const s = "まずは予行練習から始めよう。カードの順番をよく覚えてね。";
        return new QBTalk(s);
    }

    const affinity = battleOpt.enemyData.affinity;

    // 通常の場合
    if(!battleOpt.playerData || !affinity[battleOpt.playerData.suit_string]){
        const s = "いよいよバトル開始だよ。\nがんばって。";
        return new QBTalk(s);
    }

    // 相性が有利 or 不利の場合
    if(affinity[battleOpt.playerData.suit_string] > 0){
        const s = "相性バッチリみたいだね。\nがんばって。";
        return new QBTalk(s);
    }
    else{
        const s = "あまり相性が良くないみたいだね。\n気を付けて。";
        return new QBTalk(s);
    }
}

/**
 * バトルが選択されたときに喋る内容を生成する.
 * @param {Objcet.<string,*>} setting - selectSceneの設定データ
 */
const createConfirmatingQB_BeforeBattle = function(setting){
    const usedCards = setting.deckSet.cards;
    const sideboardCards = setting.sideboardSet.cards;
    const mainCard = CardAtlas.get(setting.mainCardData.id);

    let msg;
    if(usedCards.indexOf(mainCard) >= 0){
        msg = "メインカードに指定されたカードは、バトルの間デッキから\n取り除かれるよ。それでも構わないかい？\nA → YES    S → No";
    }
    else {
        msg = "バトルを開始するかい？\nA → YES    S → No";
    }

    return new QBYesNo(msg, 20, "optionSelected");
}

/**
 * チュートリアルが選択されたときに喋る内容を生成する.
 */
const createTutorialQB = function(){
    return new QBYesNo("チュートリアルを開始するかい？\nA → YES    S → No", 20, "optionSelected");
};


// (b) チュートリアルのデータ

/*
 * デッキや敵データも同じ場所にあるほうがわかりやすいので、
 * ここにまとめておいておく.
 */

/**
 * チュートリアルの各項目の情報をまとめた配列.
 * @type {Array.<Object.<string, *>>}
 */
const TutorialInfo = [
    {
        caption: "バトルの流れ", chainRule: 1,
        playerData: RAW_CARD_DATA.find((e) => e.id == "2-040"),
        enemyData: { name: "使い魔１", affinity: { }, HP: 6400, MP: 2500, actions: [] },
        cardIDs: [
            "2-004", "2-025", "1-019", "1-005", "2-021", "1-013", "2-012", "2-006",
            "1-009", "1-028", "1-026", "1-030", "1-029", "1-034", "1-012", "1-015", 
            "1-010", "1-002", "1-001", "2-024", "1-031", "1-003", "3-027", "1-017",
            "3-034", "1-006", "2-014", "1-011", "1-004", "1-016", "1-008", "2-035",
            "3-019", "1-025"
        ],
        tutorial: [
        "やあ、ようこそMAGICARD BATTLEへ。\nこのゲームではカードを使って魔女たちと戦うんだ。",
        "画面にカードが並んでいるだろう。これが君の手札だ。",
        "キーボードのＡ，Ｓ，Ｄを押すとカードが出せる。\nたくさん出すほどダメージが増えるよ。",
        "君たち魔法少女と敵が交互に攻撃を繰り返し、\n先に相手のHPを０にしたほうが勝利だ。",
        "でも、SGゲージが足りない状態だとカードを\n出せなくなってしまうから注意してね。",
        "まあ、まずはやってみるといい。\nこの程度の相手ならルールを知らなくても勝てるだろう。"
        ]
    },
    {
        caption: "SGゲージの回復", chainRule: 1,
        playerData: RAW_CARD_DATA.find((e) => e.id == "2-039"),
        enemyData: { name: "使い魔２", affinity: { }, HP: 5200, MP: 3600, actions: [] },
        cardIDs: [
            "3-039", "2-035", "2-028", "2-024", "1-059", 
            "1-017", "2-021", "2-039", "1-016", "1-032", "1-025", "2-040",
            "1-019", "1-058", "1-005", "1-018", "3-019", "3-027", "2-038", "2-017", "3-038","1-001"
        ],
        tutorial: [
        "やあ。\n今回は「SGゲージ」についてだよ。",
        "カードにはコストが設定されていて、出すたびに画面の\n一番下にあるSGゲージが減ってしまうんだ。",
        "コストを払えない場合はカードを出すことができない。\nそこで「SGゲージ回復」を使って回復させよう。",
        "ただし、「SGゲージ回復」を選ぶと\nそのターンに出したカードのMPが半分になってしまう。\n使い所には注意してね。"
        ]
    },
    {
        caption: "コンボのルール１", chainRule: 1,
        playerData: RAW_CARD_DATA.find((e) => e.id == "2-039"),
        enemyData: EnemyData["ワルプルギスの夜"],
        cardIDs: [
            "2-004", undefined, "1-005", "2-021", "2-012", "1-009", "1-028", "1-026",
            "1-030", "1-010", "1-013", "2-025", "1-002", "1-001", "2-024", "1-031",
            "1-003", "3-027", "1-017", "3-034", "2-006", "1-006", "2-014", "1-011",
            "1-004", "1-016", "1-008", "2-035", "1-029", "1-034", "1-012", "1-015",
            "3-019", "1-025"
        ],
        extraCard: function(){ const c = new Card(0,10); c.skill = PlayerSkill.chargeUp(5000, "円環の理*", "すべての魔女を消し去る"); return c; }(),
        tutorial: [
        "やあ。\n今回はこのゲームの肝である「コンボ」についてだよ。",
        "カードの中にはスキルを持つものがある。\nこれらは特定の条件を満たすことで発動できるんだ。",
        "その条件というのが「コンボ」だよ。",
        "具体的には、\n・同じマークのカードを３枚連続で出し、かつ\n・その３枚目がスキル持ちのカード、　ならコンボ成立だ。",
        "ちょうど画面にも【まどか10】のカードがあるね。\nうまくコンボを組んで発動させてみて欲しい。",
        "今回のバトルはスキル無しでは勝てないから気を付けて。"
        ]
    },
    {
        caption: "スキルの持ち越し", chainRule: 1,
        playerData: RAW_CARD_DATA.find((e) => e.id == "2-032"),
        enemyData: { name: "使い魔３", affinity: { }, HP: 5900, MP: 4800, actions: [] },
        cardIDs: [
            "1-031", "1-005", "3-036", "1-030", "2-012", "1-009", "2-030", "1-026",
            "2-004", "1-010", "2-025", "1-002", "1-001", "2-024", "1-003", "3-027",
            "1-017", "3-034", "1-006", "1-018", "1-011", "1-004", "1-016", "1-008",
            "2-035", "1-029", "2-008", "2-006", "1-012", "1-015", "3-019", "2-001",
            "1-025", "1-009"
        ],
        tutorial: [
        "やあ。\nこの前はコンボのルールを説明したね。",
        "でも、スキルはすぐに発動するだけが取り柄じゃない。\nあえて使わずに次のターンへ持ち越すことも可能だ。",
        "コンボ成立のあと、アタックなど別の行動を選択すると\n揃えたスキルは温存されたままになる。",
        "そうしておいて、他のターンにスキル発動を選べば\n好きなタイミングでスキルを発動させられるよ。",
        "コンボの温存をする場合、大抵はSGゲージの回復を兼ねて\n「SG回復」を選択するよ。",
        "いま手札にある【杏子９】はHPを回復するスキルだ。\nでも、１ターン目に回復魔法を使っても仕方ないよね。",
        "そこで、スキルを温存しておいて別のターンに使うといい。\nがんばって。"
        ]
    },
    {
        caption: "コンボのルール２", chainRule: 1,
        playerData: RAW_CARD_DATA.find((e) => e.id == "2-032"),
        enemyData: { name: "使い魔４", affinity: { }, HP: 7800, MP: 5100, actions: [] },
        cardIDs: [
            "2-004", "2-030", "1-027", "1-026", "2-025", "1-031", "1-002", "1-001",
            "2-024", "2-021", "1-020", "1-017", "3-034", "2-020", "1-018", "1-011",
            "1-004", "1-016", "1-008", "1-011", "2-035", "1-029", "2-008", "2-006",
            "1-010", "1-015", "3-018", "2-001", "1-009", "1-030", "2-011", "2-027",
            "1-025", "1-009"
        ],
        tutorial: [
        "やあ。\nそろそろ慣れてきたかい。",
        "今回はコンボの応用編だよ。",
        "いま手札には【マミ８】と【マミ９】があるね。\n素直にＳ→Ｓ→Ｄと出すと片方しか発動できない。",
        "でも、それじゃもったいないね。\n順番を工夫してこれを両方発動させて欲しいんだ。",
        "今回もスキル無しではほぼ勝てないから気を付けて。"
        ]
    },
    {
        caption: "多人数カード(第１弾ルール)", chainRule: 1,
        playerData: RAW_CARD_DATA.find((e) => e.id == "1-015"),
        enemyData: { name: "使い魔５", affinity: { }, HP: 9250, MP: 5100, actions: [] },
        cardIDs: [
            "1-035", "1-032", "2-021", "2-054", "1-033", "2-023", "1-018", "2-017",
            "1-029", "1-056", "2-009", "1-008", "3-034", "1-030", "2-014", "2-011",
            "1-009", "P-001", "1-017", "1-019", "2-035", "1-031", "2-010", "1-016",
            "1-010", "2-020", "2-052", "2-013"
        ],
        tutorial: [
        "やあ。\n今回は多人数カード。ちょっと複雑だよ。",
        "複数の絵柄が描かれている多人数カードは\nコンボでの扱いが少し例外的だ。",
        "今回は初期設定で使っている「第１弾ルール」を\n優先して紹介するね。",
        "このルールでは、１～２枚目の絵柄が３枚目のカードに\n全部含まれていればコンボとして扱われるよ。",
        "たとえば、 「さやか → さやか → ☆杏さや」 や、\n「杏子 → さやか → ☆杏さや」 はコンボが成立する。",
        "一方、「杏さや → さやか → ☆さやか」 などは失敗になる。\n３枚目が一番多くないといけないんだ。",
        "このルールのおかげで「魔法少女５人組」のカードは\n非常に簡単にコンボを成立させられる。\n紛らわしいけど、使いこなせばコンボの幅が広がるよ。",
        "今回は、１ターン目に「５人組」のカードと「さやか９」を\n発動させよう。それで大幅に勝ちやすくなるはずだ。"
        ]
    },
    {
        caption: "多人数カード(第２弾ルール)", chainRule: 2,
        playerData: RAW_CARD_DATA.find((e) => e.id == "1-015"),
        enemyData: { name: "使い魔５", affinity: { }, HP: 9250, MP: 5100, actions: [] },
        cardIDs: [
            "1-032", "2-021", "2-054", "1-033", "2-023", "1-018", "2-017", "1-040",
            "1-037", "2-009", "1-008", "3-034", "1-030", "2-014", "1-053", "1-038",
            "1-050", "2-020", "2-013", "2-050", "P-001", "1-056", "3-054", "3-042",
            "2-011", "3-044", "1-034", "1-031", "2-010", "1-016", "1-019"
        ],
        tutorial: [
        "やあ。\n前回は多人数カード（第１弾ルール）を説明したね。",
        "これに対し、MAGIARD BATTLE第２弾～第３弾では\n「第２弾ルール」が適用されていたんだ。",
        "このルールでは、「多人数カードだけを連続で３枚」出した\n場合に多人数カードのコンボが成立するよ。",
        "多人数カードであれば\n「ほむまど→杏さや→☆マミなぎ」のように\n含まれている人物がちがって大丈夫だよ。",
        "一方、第１弾ルールでは可能だった\n「さやか → さやか → ☆杏さや」 などは失敗になる。\n今度は、単独キャラのカードが混ざってはいけないんだ。",
        "ある意味わかりやすいルールだけど、多人数カードをデッキに\n混ぜて使うのが難しくなるから一長一短だね。",
        "今回も、１ターン目に「５人組」のカードと「さやか９」を\n発動させよう。\n３ターン目は素直にSG回復を選ぼう。"
        ]
    },
    {
        caption: "スキル持ちカードのマーカー", chainRule: 1,
        playerData: RAW_CARD_DATA.find((e) => e.id == "2-039"),
        enemyData: { name: "使い魔６", affinity: { }, HP: 4000, MP: 7000, actions: [] },
        cardIDs: [
            "1-035", "2-037", "3-030", "1-017", "2-021", "2-039", "1-016", "1-032",
            "1-025", "2-040", "1-005", "1-018", "3-019", "3-027"
        ],
        tutorial: [
        "やあ。\nこの前は少し難しい話題だったね。",
        "今回はスキル持ちカードに関するちょっとした補足だよ。",
        "たとえば、同じ「コスト９の杏子」でも第１弾のカードと\n第２弾のカードでは効果が違うんだ。",
        "だからコストの数字だけではどちらのカードか区別できない。\nそこで、カードの左上にマーカーが表示されているんだ。",
        "第１弾のカードは＊１つ、第２弾のカードは＊２つ、・・・\nのようにどのバージョンか区別できるようになっているよ。",
        "これは本家MAGICARD BATTLEには無い仕様だから、\nもし望むなら特殊設定でOFFにすることもできる。\nおすすめしないけどね。",
        "今回はバージョン２の杏子９を２ターン目に発動させてね。\nがんばって。"
        ]
    },
    {
        caption: "追加スキャン", chainRule: 1, extraScan: true,
        playerData: RAW_CARD_DATA.find((e) => e.id == "2-039"),
        enemyData: { name: "使い魔６", affinity: { }, HP: 4000, MP: 7000, actions: [] },
        cardIDs: [
            "1-035", "2-037", "3-030"
        ],
        tutorial: [
        "ところで、今までのチュートリアルでは\nすべてのカードを使い切ったらそれ以上カードを\n引くことができなかったよね。",
        "実は、MAGICARD BATTLE第２弾以降では\n「追加スキャン」というシステムが実装されていたんだ。",
        "デッキが空のとき、各ターン１枚だけ「メインカード以外の\nカード」を場に出すことができる。",
        "さらに、このとき出したカードがスキルを持っていた場合、\n無条件でそのスキルを発動できるよ。",
        "このゲームにも本当は追加スキャンの機能が実装されている。\n有効なカードを探して使ってみよう。",
        "ちなみに、本家MAGICARD BATTLEではデッキ枚数を\n３０枚以下にすることができない。\nできたら強すぎるからね。"
        ]
    },
    {
        caption: "敵のスキル", chainRule: 1,
        playerData: RAW_CARD_DATA.find((e) => e.id == "2-040"),
        enemyData: EnemyData["イザベル"],
        cardIDs: [
            "2-004", "2-025", "1-019", "1-005", "2-021", "1-013", "2-012", "2-006",
            "1-009", "1-028", "1-026", "1-030", "1-029", "1-034", "1-012", "1-015", 
            "1-010", "1-002", "1-001", "2-024", "1-031", "1-003", "3-027", "1-017",
            "3-034", "1-006", "2-014", "1-011", "1-004", "1-016", "1-008", "2-035",
            "3-019", "1-025"
        ],
        tutorial: [
        "やあ。\nもうだいぶ慣れてきた頃合いじゃないかな。",
        "今回は「敵のスキル」についてだよ。\n特定のターンの開始時に、敵もスキルを使ってくる。",
        "イザベルの場合、大ダメージで、しかもシールドでは\n防げない強力な攻撃を３ターン目に使ってくる。",
        "警戒していないといきなり負けてしまうから注意してね。"
        ]
    },
    {
        caption: "メインスキル", chainRule: 1,
        playerData: RAW_CARD_DATA.find((e) => e.id == "1-007"),
        enemyData: EnemyData["ホムリリー"],
        cardIDs: [
            "1-001", "1-007", "3-034", "1-027", "3-039", "3-007", "1-060", "2-006", "1-025",
            "3-028", "1-032", "2-001", "1-030", "3-036", "2-030", "1-023", "3-006", "3-040",
            "1-035", "1-031", "2-007", "1-033", "1-002", "1-029", "2-037", "2-038", "1-003",
            "2-002", "1-058", "3-038", "2-039", "2-024", "1-028", "2-031", "3-029", "1-024"
        ],
        tutorial: [
        "やあ。\nいよいよ今回が最終回だよ。",
        "今回は「メインスキル」について。\n高レアリティのカード（コスト８以上）の多くは\nメインスキルを持っているんだ。",
        "１試合に１回、ターン開始時に強力なスキルを発動できるよ。",
        "その効果はどれも絶大だ。使えばほぼ試合に勝てるだろう。",
        "その強力さのせいで、ゲームが成立しなくなる\nおそれもある。使いすぎには注意してね。"
        ]
    },

];
