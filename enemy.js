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
 */
class EnemyActionDealerBase{
    constructor(){
        this.actionList = [];
        this.poisonRate = 0;
    }

    init(actionList){
        this.actionList = actionList;
    }

    *wait(frames){
        while(frames-- > 0) yield true;
    }

    *upkeep(GE){
        if(this.poisonRate > 0) yield* this.poison(this.poisonRate);
    }

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
 * 敵の特殊攻撃を生成する関数をまとめたもの.
 * @type {Object.<string, function>}
 */
const EnemyAction = {
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

    attack: function(percent, cap = null, desc = null){
        return {
            caption: cap || "強力な一撃",
            desc: desc || `敵MP×${percent}％のダメージ（この攻撃は防御できない）`,
            *effect(dealer){
                yield* dealer.damage(percent);
            }
        };
    },

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

    poison: function(percent, cap = null, desc = null){
        return {
            caption: cap || "呪い効果",
            desc: desc || `ターンの開始時に魔法少女のHPが${percent}％減少`,
            *effect(dealer){
                dealer.poisonRate += percent;
            }
        };
    },

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
