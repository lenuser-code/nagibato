/**
 * @file
 * プレイヤーおよび敵を表すクラスを実装する.
 * ここで定義するのはデータの集合としてのPlayer/Enemyであり,
 * スキルなどは別のファイルで定義する.
 *
 * @author lenuser
 */


// #1. 補助

/**
 * ステータスの等速変化を実現するMeterオブジェクトを作る.
 * あるパラメータがAからBへ変化するとき, モデル内部では一瞬で値がBになるが,
 * GUIではAからBまで一定の時間を掛けて変化する様子を描画したい.
 * この時間変化を表現するために使う.
 *
 * @param {number} v - 初期値
 * @param {number} max - 最大値
 * @param {number} frames - 変化に要するフレーム数の既定値
 * @returns {stdtask.Meter} 生成されたMeterオブジェクト
 */
createMeter = function(v, max, frames){
    return new stdtask.Meter(v, max, frames);
}


// #2. Player, Enemy

/**
 * HP, MP, nameを持つオブジェクトのためのクラス.
 * ただし, 実際はカプセル化しているのでメソッドでアクセスする.
 *
 * また, HPに対してHPMeter, MPに対してMPMeterも同時に用意する.
 * この2つは公開されている.
 * @class
 * @prop {stdtask.Meter} HPMeter - HPの値を表すMeterオブジェクト
 * @prop {stdtask.Meter} MPMeter - MPの値を表すMeterオブジェクト
 */
class BasicStatus{
    #HP;
    #MP;
    #maxHP;
    #defaultMP;
    #name;

    /** @returns {number} 現在のHP */
    HP(){ return this.#HP; }

    /** @returns {number} 現在のMP */
    MP(){ return this.#MP; }

    /** @returns {string} 設定された名前 */
    name(){ return this.#name; }

    /**
     * 指定した値をHPに加える. 同時にHPMeterのchangeToメソッドを呼び出す.
     * ただし, 取りうる値の範囲を越えている場合, 最終的に保持される値は
     * 0 (最小値) or 最大HP (最大値) に修正される.
     * @param {number} v - 加算する値
     */
    addHP(v){
        this.#HP += v;
        this.HPMeter.changeTo(this.#HP, 60);
        if(this.#HP < 0) this.#HP = 0;
        if(this.#HP > this.#maxHP) this.#HP = this.#maxHP;
    }

    /**
     * 指定した値をMPに加える. 同時にMPMeterのchangeToメソッドを呼び出す.
     * ただし, 結果が 0 以下になる場合, 最終的に保持される値は 1 になる.
     * @param {number} v - 加算する値
     */
    addMP(v){
        this.#MP += v;
        this.MPMeter.changeTo(this.#MP, 60);
        if(this.#MP < 0) this.#MP = 1;
    }

    /**
     * (最大HP × p/100) の端数を切り捨てた値を計算する.
     * @param {number} p - 倍率をパーセントで表現した数値
     * @returns {number} 求めた値
     */
    percentHP(p){
        return Math.floor(this.#maxHP * p / 100);
    }

    /**
     * (基本MP × p/100) の端数を切り捨てた値を計算する.
     * @param {number} p - 倍率をパーセントで表現した数値
     * @returns {number} 求めた値
     */
    percentMP(p){
        return Math.floor(this.#defaultMP * p / 100);
    }

    /**
     * (現在のHP / 最大HP) を計算する.
     * @returns {number} 求めた値
     */
    retentionRateHP(){
        return (this.#HP / this.#maxHP)
    }

    /**
     * (現在のMP / 基本MP) を計算する.
     * @returns {number} 求めた値
     */
    retentionRateMP(){
        return (this.#MP / this.#defaultMP)
    }

    /**
     * このオブジェクトを初期化する.
     * @param {number} maxHP - 最大HP
     * @param {number} defaultMP - 基本MP
     * @param {string} name - このオブジェクトに設定する名前
     */
    init(maxHP, defaultMP, name){
        this.#HP = this.#maxHP = maxHP;
        this.#MP = this.#defaultMP = defaultMP;
        this.#name = name;

        this.HPMeter = this.HPMeter || createMeter(maxHP, maxHP, 60);
        this.MPMeter = this.MPMeter || createMeter(defaultMP, 99999, 60);

        this.HPMeter.init(maxHP, maxHP);
        this.MPMeter.init(defaultMP, 99999);
    }
}

/**
 * プレイヤーのステータスを保持するクラス.
 * HP, MP, nameに加えて, 以下のステータスを持つ.
 * - id: メインカードとしてのID
 * - suitString: 自身の属性を表す文字列
 * - mark: Suits内におけるsuitStringのインデックス
 * - SG: ソウルジェムの値 (0～100で表現)
 * - mainSkill: メインスキルを表すオブジェクト
 * - mainSkillCount: メインスキルの残り使用可能回数
 * - shield: シールドの残り回数
 * - stun: 行動不能状態の残り時間
 *
 * ただし, これらのステータスもカプセル化されているので,
 * メソッドでアクセスする.
 *
 * @class
 * @prop {stdtask.Meter} HPMeter - HPの値を表すMeterオブジェクト
 * @prop {stdtask.Meter} MPMeter - MPの値を表すMeterオブジェクト
 * @prop {stdtask.Meter} SGMeter - SGの値を表すMeterオブジェクト
 * @extends BasicStatus
 */
class Player extends BasicStatus{
    #id;
    #SG;
    #shield;
    #stun;
    #suitString;
    #mark;
    #mainSkill;
    #mainSkillCount;

    /** @returns {string} メインカードとしてのID */
    id(){
        return this.#id;
    }

    /** @returns {number} 現在のSG */
    SG(){
        return this.#SG;
    }

    /** @returns {number} シールドの残り回数 */
    shield(){
        return this.#shield;
    }

    /**@returns {number} 行動不能状態の残り時間 */
    stun(){
        return this.#stun;
    }

    /** @returns {string} このオブジェクトの属性を表す文字列 */
    suitString(){
        return this.#suitString;
    }

    /**
     * このオブジェクトの属性をSuits内におけるインデックスで表した値.
     * @returns {number} このオブジェクトの属性を表す数字
     */
    mark(){
        return this.#mark;
    }

    /**
     * このオブジェクトの属性が複合属性かどうか判定する.
     * @returns {boolean} 複合属性ならtrue, 基本属性ならfalse
     **/
    isPrismatic(){
        return (this.#mark >= PrimitiveSuits.length);
    }

    /** @returns {number} メインスキルの残り使用可能回数*/
    mainSkillCount(){
        return this.#mainSkillCount;
    }

    /**
     * 指定した値をSGに加える. 同時にSGMeterのchangeToメソッドを呼び出す.
     * ただし, 取りうる値の範囲を越えている場合, 最終的に保持される値は
     * 0 (最小値) or 100 (最大値) に修正される.
     * @param {number} v - 加算する値
     * @param {number} [frames=60] - changeToメソッドの引数として与えるフレーム数
     */
    addSG(v, frames=60){
        this.#SG += v;
        this.SGMeter.changeTo(this.#SG, frames);
        if(this.#SG < 0) this.#SG = 0;
        if(this.#SG > 100) this.#SG = 100;
    }

    /**
     * SGの値を100にする. 同時にSGMeterのchangeToメソッドを呼び出す.
     */
    resetSG(){
        this.#SG = 100;
        this.SGMeter.changeTo(100, 60);
    }

    /**
     * SGの値がcost以上ならば, addSG(-cost, 5)を実行する.
     * そうでない場合は何もしない.
     * @param {number} cost - SGから減算する値
     * @returns {boolean} SGからcostを減算した場合true, そうでない場合false
     */
    payCost(cost){
        if(this.#SG < cost) return false;
        this.addSG(-cost, 5);
        return true;
    }

    /**
     * シールドの残り回数にvを加える.
     * ただし, 結果が負になる場合は 0 にする.
     * @param {number} v - 加算する値
     */
    addShield(v){
        this.#shield = Math.max(0, this.#shield + v);
    }

    /**
     * 行動不能状態の残り時間にvを加える.
     * ただし, 結果が負になる場合は 0 にする.
     * @param {number} v - 加算する値
     */
    addStun(v){
        this.#stun = Math.max(0, this.#stun + v);
    }

    /**
     * メインスキルが使用可能ならば, 残り使用回数 1 減らしてから
     * メインカードを返す.
     * @returns {?Object} メインカードが使用可能ならメインカードオブジェクト,
     * 使用可能でない場合はnull
     */
    shiftMainSkill(){
        if(this.#mainSkillCount == 0) return null;
        this.#mainSkillCount--;
        return this.#mainSkill;
    };

    /**
     * 指定されたカードデータを読み取り, メインスキルが存在する場合は
     * そのスキルを実現するオブジェクトを生成する (init()も参照のこと).
     * もしメインスキルが存在しない場合はnullを返す.
     * @param {Object.<string, *>} opt - カードデータを格納した連想配列
     * @returns {?Object} メインスキルがあれば生成されたオブジェクト,
     * 存在しない場合はnull
     */
    parseMainSkill(opt){
        if(!opt.main) return null;
        const info = opt.main.nagibato_code;
        const fn = PlayerSkill[info[0]];
        if(!fn) throw new Error(`PlayerSkill.${info[0]}は未実装です`);
        return fn(...info.slice(1));
    }

    /**
     * 指定されたカードデータを元にこのオブジェクトを初期化する.
     * ここで, カードデータとは
     * 1. ROW_CARD_DATAに登録されている要素のいずれか
     * 2. または, それらと互換性のある連想配列
     * のことを指す.
     *
     * 実際にはすべてのフィールドを参照するわけではなく, optに次の要素が
     * 設定されていればよい.
     * - id
     * - character
     * - suit_string
     * - MP
     * - HP
     * - main (メインスキルがある場合)
     *
     * このゲームにおける「プレイヤー」とはMAGICARD BATTLEでの「メインカード」
     * と基本的に同義であるので, チュートリアルなど特殊な状況を除いては
     * カードデータを参照することになる.
     * @param {Object} opt - メインカードのデータを格納した連想配列
     */
    init(opt){
        const maxHP = opt.HP, defaultMP = opt.MP, name = opt.character;
        super.init(maxHP, defaultMP, name);
        this.#SG = 100;
        this.#shield = 0;
        this.#stun = 0;
        this.#suitString = opt.suit_string;
        this.#mark = Suits.indexOf(this.#suitString);
        this.#mainSkill = this.parseMainSkill(opt);
        this.#mainSkillCount = (this.#mainSkill ? 1 : 0);
        this.#id = opt.id;

        this.SGMeter = this.SGMeter || createMeter(100, 100, 60);
        this.SGMeter.init(100, 100);
    }

    /**
     * 指定されたカードデータを元にしてインスタンスを生成する
     * (カードデータの情報はinit()により取り込まれる. init()も参照のこと).
     * @param {Object} opt - メインカードのデータを格納した連想配列
     */
    constructor(opt){
        super();
        this.init(opt);
    }
}

/**
 * 敵のステータスを保持するクラス.
 * HP, MP, nameに加えて, 以下のステータスを持つ.
 * - antiskill: この敵に対してアンチスキルを使用できるカードの一覧
 *
 * @class
 * @prop {stdtask.Meter} HPMeter - HPの値を表すMeterオブジェクト
 * @prop {stdtask.Meter} MPMeter - MPの値を表すMeterオブジェクト
 * @extends BasicStatus
 */
class Enemy extends BasicStatus{
    #antiskill;

    /**
     * 指定されたIDのカードがこの敵に対してアンチスキルを使えるか調べる.
     * @param {string} cardID - カードのID
     * @returns {boolean} 使用可能ならtrue, そうでなければfalse
     */
    antiskillContains(cardID){
        return this.#antiskill.includes(cardID);
    }

    /**
     * 指定された敵データとプレイヤーの属性を元にこのオブジェクトを初期化する.
     * ここで, 敵データとは
     * 1. EnemyDataに値として登録されている要素のいずれか
     * 2. または, それらと互換性のある連想配列
     * のことを指す.
     *
     * 具体的には, optに次の要素が設定されていればよい.
     * - name
     * - affinity
     * - HP
     * - MP
     * - actions
     *
     * また, プレイヤーの属性は相性の判定に用いられる.
     * プレイヤーから見て, この敵と相性が良ければ敵のHP, MPが低くなり,
     * 相性が悪ければ敵のHP, MPが高くなる.
     * @param {Object} opt - 敵データを格納した連想配列
     * @param {?string} [playerSS=null] - プレイヤーの属性を表す文字列.
     * 属性を設定しない場合はnullを指定する
     */
    init(opt, playerSS = null){
        let HP = opt.HP;
        let MP = opt.MP;
        this.#antiskill = opt.antiskill || [];

        // 相性の処理
        if(playerSS && opt.affinity[playerSS]){
            const aff = opt.affinity[playerSS];
            HP = Math.floor(HP * 5 / (5+aff));
            MP = Math.floor(MP * (5 - aff) / 5);
        }

        super.init(HP, MP, opt.name);
    }

    /**
     * 指定された敵データとプレイヤーの属性を元にインスタンスを生成する
     * (これらの情報はinit()により取り込まれる. init()も参照のこと).
     * @param {Object} opt - 敵データを格納した連想配列
     * @param {?string} [playerSS=null] - プレイヤーの属性を表す文字列.
     * 属性を設定しない場合はnullを指定する
     */
    constructor(opt, playerSS = null){
        super();
        this.init(opt, playerSS);
    }
}
