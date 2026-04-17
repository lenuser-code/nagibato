/*
 * @file
 * 敵の特殊攻撃に関連するオブジェクトと敵のカタログを実装する.
 *
 * @author lenuser
 */


// #1. 敵の特殊攻撃とその実行インターフェース

/**
 * 敵のスキルの実行インターフェース.
 * スキルを表すオブジェクトAと, その実行者Bの間の仲介を行う.
 * Aはこのクラスが提供する機能を利用してスキルを実行する.
 * Bはこのクラスの *upkeep や *specialAction によりAの実行を依頼する.
 *
 * EnemyActionDealerBase自体は各スキル効果の具体的な処理方法を知らない.
 * 具体的な処理内容はサブクラスで実装する.
 * - turnCount()
 * - playerHP()
 * - *common(action)
 * - *antiskill(callback)
 * - *poison(percent)
 * - *stun(n)
 * - *damage(percent)
 * - *nightmare(str, mark, percent)
 * - *transform(enemyName)
 *
 * @class
 * @prop {number} poisonRate - 毎ターン開始時にプレイヤーへ与えるダメージ量を「敵MPに対するパーセント表示」で表した値
 */
class EnemyActionDealerBase{
    /**
     * 何も設定されていない状態のインスタンスを作成する.
     */
    constructor(){
        this.actionList = [];
        this.poisonRate = 0;
    }

    /**
     * 指定された行動リストをこのオブジェクトにセットする.
     * ここで, actionListは「nターン目に実行する敵スキルをactionList[n-1]に格納したもの」である.
     * もしactionList[n-1]がnullの場合, nターン目には何も行わない (nullの代わりに他の偽判定の値をセットしてもよい).
     * @param {Array<EnemyAction_skill>} actionList - 設定する行動リスト
     */
    init(actionList){
        this.actionList = actionList;
    }

    /**
     * 指定されたフレーム数だけyield trueを繰り返すジェネレータを生成する.
     * framesが0以下の場合は何もしない.
     * @param {number} frames - 待機するフレーム数
     */
    *wait(frames){
        while(frames-- > 0) yield true;
    }

    /**
     * 敵側アップキープの処理を実行するジェネレータを生成する.
     * @param {stdgam.GameEngine} GE - この処理に用いるGameEngine
     */
    *upkeep(GE){
        if(this.poisonRate > 0) yield* this.poison(this.poisonRate);
    }

    /**
     * 現在のターン数に応じて敵の特殊行動を実行するジェネレータを生成する.
     * 行動の内容はinitメソッドで設定された行動リストによって決定する.
     * @param {stdgam.GameEngine} GE - この処理に用いるGameEngine
     */
    *specialAction(GE){
        const action = this.actionList[ this.turnCount()-1 ];
        if(action){
            yield* this.common(action);

            let f = true;
            yield* this.antiskill(() => {f = false});
            if(f) yield* action.effect(this);
        }
    }
}

/**
 * @typedef {Object} EnemyAction_skill
 * @prop {string} caption - スキル名
 * @prop {string} desc - 効果の説明
 * @prop {GeneratorFunction} effect - 引数として受け取ったEnemyActionDealerBaseを使ってスキルの効果を実装する
 */

/**
 * 敵の特殊攻撃を生成する関数をまとめたもの.
 * @type {Object.<string, function>}
 * @namespace
 */
const EnemyAction = {
    /**
     * プレイヤーを指定されたターン数の間行動不能にするスキル.
     * @param {number} n - 行動不能になるターン数
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {EnemyAction_skill} 生成されたスキル
     */
    stun: function(n, cap = null, desc = null){
        return {
            caption: cap ||"相手を束縛",
            desc: desc || (n == 1 ? "このターン、魔法少女の行動を封じる"
                                  : `${n}ターンの間、魔法少女の行動を封じる`),
            *effect(dealer){
                yield* dealer.stun(n);
            }
        };
    },

    /**
     * プレイヤーにダメージを与えるスキル.
     * @param {number} percent - ダメージ量が敵MPの何％か指定する
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {EnemyAction_skill} 生成されたスキル
     */
    attack: function(percent, cap = null, desc = null){
        return {
            caption: cap || "強力な一撃",
            desc: desc || `敵MP×${percent}％のダメージ（この攻撃は防御できない）`,
            *effect(dealer){
                yield* dealer.damage(percent);
            }
        };
    },

    /**
     * プレイヤーに複数回ダメージを与えるスキル.
     * @param {number[]} option - 「1回のダメージ量が敵MPの何％か指定する値」と
     * 「攻撃回数」をこの順番に並べた配列
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {EnemyAction_skill} 生成されたスキル
     */
    multiAttack: function(option, cap = null, desc = null){
        const [percent, n] = option;
        return {
            caption: cap || "多段攻撃",
            desc: desc || `敵MP×${percent}％のダメージを${n}回受ける\n（この攻撃は防御できない）`,
            *effect(dealer){
                for(let i = 0; i < n; i++){
                    yield* dealer.damage(percent);
                    if(dealer.playerHP() <= 0) break;
                    else yield* dealer.wait(60);
                }
            }
        };
    },

    /**
     * 指定された属性以外のカードのMPを低下させるスキル.
     * @param {Array<string|number>} option - 「効果対象を説明する文字列,
     * 対象の属性のインデックス, 効果量をパーセントで表した値」をこの順番に並べた配列
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {EnemyAction_skill} 生成されたスキル
     */
    nightmare: function(option, cap = null, desc = null){
        const [str, mark, percent] = option;
        return {
            caption: cap || "指定属性以外の弱化",
            desc: desc || `${str}以外のカードのMPが${percent}％ダウン`,
            *effect(dealer){
                yield* dealer.nightmare(str, mark, percent);
            }
        };
    },

    /**
     * 各ターンのアップキープ時にプレイヤーへダメージを与えるスキル.
     * @param {number} percent - ダメージ量が敵MPの何％か指定する
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {PlayerSkill_skill} 生成されたスキル
     */
    poison: function(percent, cap = null, desc = null){
        return {
            caption: cap || "呪い効果",
            desc: desc || `ターンの開始時に魔法少女のHPが${percent}％減少`,
            *effect(dealer){
                dealer.poisonRate += percent;
            }
        };
    },

    /**
     * EnemyDataから指定された名前の敵データを探し, このバトルの敵の設定を
     * 探してきたデータで上書きするスキル. このとき, 敵のHP・MPもリセットされる.
     * @param {string} enemyName - 新しい敵の名前 (EnemyDataへの登録名)
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {PlayerSkill_skill} 生成されたスキル
     */
    transform: function(enemyName, cap = null, desc = null){
        return {
            caption: cap || "変身",
            desc: desc || "真の姿をあらわす",
            *effect(dealer){
                yield* dealer.transform(enemyName);
            }
        };
    }
};


// #2. 敵のカタログ

/**
 * このゲームに登場する敵のデータを登録する連想配列.
 * @type {Object.<string, *>}
 */
const EnemyData = {
    "キュゥべえ": {
        name: "キュゥべえ",
        affinity: { },
        HP: 1000,
        MP: 100,
        actions: [ ]
    },

    "ゲルトルート": {
        name: "ゲルトルート",
        affinity: { "Mm": 1,  "Md": -1 }, antiskill: [ "1-027", "2-029", "3-028" ],
        HP: 8000,
        MP: 3500,
        actions: [
            null, null, EnemyAction.stun(1, "バインド")
        ]
    },

    "イザベル": {
        name: "イザベル",
        affinity: { "Md": 1,  "Hm": -1 }, antiskill: [ "1-006", "2-007", "3-006" ],
        HP: 8000,
        MP: 3500,
        actions: [
            null, null, EnemyAction.attack(200, "ボディプレス")
        ]
    },

    "ギーゼラ": {
        name: "ギーゼラ",
        affinity: { "Ky": 1 }, antiskill: [ "2-036", "3-035" ],
        HP: 10000,
        MP: 4000,
        actions: [
            null, null, EnemyAction.attack(200, "エキゾースト")
        ]
    },

    "シャルロッテ": {
        name: "シャルロッテ",
        affinity: { "Mm": 1,  "Md": -1 }, antiskill: [ "1-013", "2-014", "3-013" ],
        HP: 10000,
        MP: 4000,
        actions: [
            null, null, EnemyAction.transform("シャルロッテ２")
        ]
    },

    "シャルロッテ２": {
        name: "シャルロッテ",
        affinity: { "Hm": 1,  "Mm": -1 },
        HP: 10000,
        MP: 4000,
        actions: [ ]
    },

    "パトリシア": {
        name: "パトリシア",
        affinity: { "Hm": 1,  "Md": -1 }, antiskill: [ "1-014", "2-015", "3-014" ],
        HP: 12000,
        MP: 4000,
        actions: [
            null, null, EnemyAction.multiAttack([50,4], "友達紹介")
        ]
    },

    "エルザマリア": {
        name: "エルザマリア",
        affinity: { "Sy": 1 },  antiskill: [ "2-022", "3-020" ],
        HP: 8000,
        MP: 3500,
        actions: [
            null, null, EnemyAction.multiAttack([50,4], "影の龍")
        ]
    },

    "H.N.エリー": {
        name: "H.N.エリー",
        affinity: { "Sy": 1,  "Md": -1 }, antiskill: [ "2-023", "3-021" ],
        HP: 8000,
        MP: 3500,
        actions: [
            null, null, EnemyAction.multiAttack([50,4], "異界のいざない")
        ]
    },

    "ロベルタ": {
        name: "ロベルタ",
        affinity: { "Hm": 1 }, antiskill: [ "2-015", "3-013", "3-014" ],
        HP: 12000,
        MP: 4000,
        actions: [
            null, null, EnemyAction.multiAttack([50,4], "ついばみ")
        ]
    },

    "オクタヴィア": {
        name: "オクタヴィア",
        affinity: { "Ky": 1,  "Md": -1 }, antiskill: [ "2-037" ],
        HP: 12000,
        MP: 4000,
        actions: [
            null, null, EnemyAction.multiAttack([50,4], "舵輪攻撃")
        ]
    },

    "ワルプルギスの夜": {
        name: "ワルプルギスの夜",
        affinity: { "Md": 1,  "Hm": -1 }, antiskill: [ "1-007", "2-008", "3-007" ],
        HP: 12000,
        MP: 4500,
        actions: [
            null, null, EnemyAction.attack(200, "ビルクラッシュ"),
            EnemyAction.attack(200, "スーパーセル")
        ]
    },

    "ナイトメア": {
        name: "ナイトメア",
        affinity: { "Na": 1,  "Md": -1,  "Hm": -1,  "Sy": -1,  "Mm": -1, "Ky": -1 },
        HP: 12000,
        MP: 4000,
        actions: [
            null, null, EnemyAction.nightmare(["薄紫属性", 5, 20], "夢の国")
        ]
    },

    "ホムリリー": {
        name: "ホムリリー",
        affinity: { "Md": 1,  "Hm": -1,  "Sy": -1,  "Mm": -1,  "Ky": -1,  "Na": -1 },
        antiskill: [ "2-008", "3-007" ],
        HP: 15000,
        MP: 5000,
        actions: [
            EnemyAction.poison(20, "死の宣告"), null,
            EnemyAction.multiAttack([50,4], "トゥースアタック")
        ]
    }
};
