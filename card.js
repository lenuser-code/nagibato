/**
 * @file
 * カードに関連するオブジェクトを実装する.
 *
 * @author lenuser
 */


// #1. 属性の定義・実装

/*
 * カードは「属性」と「数字」を持つ.
 * このうち, 属性はさらに「基本属性」と「複合属性」に分かれる.
 *
 * 基本属性は PrimitiveSuits で定義される.
 * また, Suits にも初期値としてこれらの値が格納される. 複合属性はそれが
 * 必要になったとき自動的に Suits に追加される.
 * 以下, 「属性の値」とはこれらの文字列のこととする.
 *
 * 現実には, 属性の値そのものを直接扱うことは少なく, 多くは「 Suits 内における
 * その属性のインデックス」を利用する. ただし, ファイル名の生成や
 * ImagePool などで使う文字列キーの生成では属性の値自体を直接使う.
 *
 * また, コンボの判定に使うデータを ChainMask に格納する.
 * 複合属性が Suits に追加されるとき ChainMask にも適切な値が追加される.
 * これらの値を使ってコンボの判定を行う関数が ChainFunc に設定される.
 */

// (a) 属性

/**
 * 基本属性を定義するリスト.
 * @type string[]
 */
const PrimitiveSuits = [ "Md", "Hm", "Sy", "Mm", "Ky", "Ng" ];

/**
 * プログラムで使われている属性を登録するリスト.
 * @type string[]
 */
const Suits = [...PrimitiveSuits];

/**
 * 複合属性の属性名を生成する
 * @param {number[]} marks - 各構成要素のPrimitiveSuitsにおけるインデックス
 * @returns {string} 生成された属性名
 */
const getPolysuitName = function(marks){
    const names = marks.map((m) => PrimitiveSuits[m]);
    return names.join("");
}


// (b) キャラクター名 (or カード名) への変換

/**
 * 基本属性をキャラクターのフルネームに変換する連想配列.
 * @type Object.<string, string>
 */
const CharacterNames = {
    Md: "鹿目まどか",  Hm: "暁美ほむら",  Sy: "美樹さやか",  Mm: "巴マミ",
    Ky: "佐倉杏子",  Ng: "百江なぎさ"
};

/**
 * 基本属性をキャラクターの下の名前に変換する連想配列.
 * @type Object.<string, string>
 */
const ShortCharacterNames ={
    Md: "まどか",  Hm: "ほむら",  Sy: "さやか",  Mm: "マミ",
    Ky: "杏子",  Ng: "なぎさ"
};

/**
 * 指定された属性に対応するカード名を生成する.
 * @param {string} suitString - 属性の値
 * @returns {string} 生成されたカード名
 */
const getCharacterName = function(suitString){
    if(suitString.length >= 10) return "魔法少女";
    if(suitString.length == 2) return CharacterNames[suitString];
    const splitted = suitString.match(/.{1,2}/g);
    return splitted.map((e) => ShortCharacterNames[e]).join("＆");
}


// (c) コンボ判定用の値 (マスク)

/**
 * 各属性に対して割り当てられたコンボ判定用のマスク.
 * @type number[]
 */
const ChainMask = [ 1, 2, 4, 8, 16, 32 ];

/**
 * 複合クラスのためのマスクを計算する
 * @param {number[]} indices - 各構成要素のPrimitiveSuitsにおけるインデックス
 * @returns {number} 生成されたマスクの値
 */
const getPolysuitMask = function(indices){
    let m = 0;
    for(const i of indices) m |= ChainMask[i];
    return m;
}

/**
 * 各属性の強化倍率を扱うオブジェクト.
 * 一部のスキル (敵スキルを含む) では「特定の属性だけMPが増加」のように
 * 属性ごとに影響の違う効果を引き起こすことがある.
 * これを管理するために用意する (複合属性は全部ひとまとめにして扱う).
 * @type {Object}
 * @prop {number[]} primitive - 各基本属性に対するMPの補正量をパーセントで表した値
 * @prop {number} prismatic - 複合属性 ("Ng"を含むもの以外) に対するMPの補正量をパーセントで表した値
 * @namespace
 */
const MPBoostBySuit = {
    primitive: PrimitiveSuits.map((e) => 100),
    prismatic: 100,

    /**
     * このオブジェクトを初期化する.
     */
    init(){
        this.primitive.fill(100);
        this.prismatic = 100;
    },

    /**
     * Suits[m]に対する強化倍率を計算する.
     * 複合属性は基本的に全部「白属性」という単一の括りで扱うが,
     * "Ng" を含むものは例外的に "Ng" として扱う (理由は不明・・・)
     * @param {number} m - Suitsにおけるその属性のインデックス
     * @returns {number} その属性に対するMPの補正量をパーセントで表した値
     */
    get(m){
        if(ChainMask[m] & ChainMask[5]) m = 5;
        return (this.primitive[m] ?? this.prismatic) / 100;
    }
};


// (d) コンボ判定関数

/*
 * コンボの成立条件はバージョンによって異なるため, 採用するルールに応じて
 * これらの関数を使い分けること.
 */

/**
 * MAGICARD BATTLE第1弾のルールに従い, 3枚のカードがコンボの条件を
 * 満たしているか判定する
 * (3枚目のカードがスキルを持つかどうかはチェックしない).
 * @param {(Card|PrismaticCard)} a
 * @param {(Card|PrismaticCard)} b
 * @param {(Card|PrismaticCard)} c
 * @returns {boolean} コンボが成立していればtrue, 不成立ならfalse
 */
const ChainFunc = function(a, b, c){
    return ((a.mask & c.mask) == a.mask) && ((b.mask & c.mask) == b.mask);
}

/**
 * MAGICARD BATTLE第2弾のルールに従い, 3枚のカードがコンボの条件を
 * 満たしているか判定する
 * (3枚目のカードがスキルを持つかどうかはチェックしない).
 * @param {(Card|PrismaticCard)} a
 * @param {(Card|PrismaticCard)} b
 * @param {(Card|PrismaticCard)} c
 * @returns {boolean} コンボが成立していればtrue, 不成立ならfalse
 */
const ChainFuncVer2 = function(a, b, c){
    if(c.mark < PrimitiveSuits.length){
        return ((a.mark == b.mark) && (b.mark == c.mark));
    }
    else{
        return (a.mark >= PrimitiveSuits.length)
               && (b.mark >= PrimitiveSuits.length);
    }
}


// #2. カード, およびカードに関連する機能

// (a) スキルとその実行インターフェース

/**
 * プレイヤー側のスキルの実行インターフェース.
 * スキルを表すオブジェクトAと, その実行者Bの間の仲介を行う.
 * Aはこのクラスが提供する機能を利用してスキルを実行する.
 * Bはこのクラスの *upkeep や *deal によりAの実行を依頼する.
 *
 * SkillDealerBase自体は各スキル効果の具体的な処理方法を知らない.
 * 具体的な処理内容はサブクラスで実装する.
 * - enemyHP()
 * - *addHP(percent)
 * - *addMP(percent)
 * - *addSG(percent)
 * - *addHPSG(percent)
 * - *addShield(n)
 * - *chargeUp(percent)
 * - *reduceEnemyMP(percent)
 * - *suitSpecificBoost(str, mark, percent)
 * - *damage(percent)
 * - *extendTime(n)
 * - *timeWarp()
 * - *heal(percent)
 * - *SGHeal(percent)
 * - *crisisBoostTask(percent)
 *
 * @class
 * @param healRate - ターン開始時のHP回復量を最大HPに対するパーセント表示で表した値
 * @param SGHealRate - ターン開始時のSG回復量
 * @param crisisBonus - crisisBoostの効果量を基本MPに対するパーセント表示で表した値
 * @param appliedCB - crisisBoostの効果のうち, 現時点で既に適用済みの効果量
 */
class SkillDealerBase{
    constructor(){
        this.healRate = 0;
        this.SGHealRate = 0;
        this.crisisBonus = 0;
        this.appliedCB = 0;
    }

    *wait(frames){
        while(frames-- > 0) yield true;
    }

    *upkeep(GE){
        // healが実行されない場合, crisisBoostのHPチェックを自分で実行
        if(this.healRate > 0) yield* this.heal(this.healRate);
        else yield *this.crisisBoostTask(this.crisisBonus);

        // SGHealの実行
        if(this.SGHealRate > 0) yield* this.SGHeal(this.SGHealRate);
    }

    *playerChanged(){
        yield *this.crisisBoostTask(this.crisisBonus);
    }

    *deal(GE, skill){
        yield* skill.effect(this);
    }
}

/**
 * @typedef {Object} PlayerSkill_skill
 * @prop {string} caption - スキル名
 * @prop {string} desc - 効果の説明
 * @prop {GeneratorFunction} effect - 引数として受け取ったSkillDealerBaseを使ってスキルの効果を実装する
 */

/**
 * プレイヤー側のスキルを生成する関数をまとめたもの.
 * @type {Object.<string, function>}
 * @namespace
 */
const PlayerSkill = {
    /**
     * HPを回復するスキル.
     * @param {number} percent - 回復量が最大HPの何％か指定する
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {PlayerSkill_skill} 生成されたスキル
     */
    addHP: function(percent, cap = null, desc = null){
        return {
            caption: cap || "体力回復",
            desc: desc || `HPを${percent}％回復`,
            *effect(dealer){
                yield* dealer.addHP(percent);
            }
        };
    },

    /**
     * MPを増加させるスキル.
     * @param {number} percent - 増加量が基本MPの何％か指定する
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {PlayerSkill_skill} 生成されたスキル
     */
    addMP: function(percent, cap = null, desc = null){
        return {
            caption: cap || "MPアップ",
            desc: desc || `メインカードMPが${percent}％アップ`,  // 「の」が入らないみたい
            *effect(dealer){
                yield* dealer.addMP(percent);
            }
        };
    },

    /**
     * SGを回復するスキル.
     * @param {number} percent - 回復量が何％か指定する
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {PlayerSkill_skill} 生成されたスキル
     */
    addSG: function(percent, cap = null, desc = null){
        return {
            caption: cap || "ソウルジェム回復",
            desc: desc || `ソウルジェムを${percent}％回復`,
            *effect(dealer){
                yield* dealer.addSG(percent);
            }
        };
    },

    /**
     * HPとSGを回復するスキル.
     * @param {number} percent - 回復量がそれぞれの最大値の何％か指定する
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {PlayerSkill_skill} 生成されたスキル
     */
    addHPSG: function(percent, cap = null, desc = null){
        return {
            caption: cap || "HPとソウルジェムを回復",
            desc: desc || `HPとソウルジェムを${percent}％回復`,
            *effect(dealer){
                yield* dealer.addHPSG(percent);
            }
        };
    },

    /**
     * ターン開始時にHPを回復するスキル.
     * @param {number} percent - 回復量が最大HPの何％か指定する
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {PlayerSkill_skill} 生成されたスキル
     */
    heal: function(percent, cap = null, desc = null){
        return {
            caption: cap || "癒し効果",
            desc: desc || `ターンの開始時にHPが${percent}％回復`,
            *effect(dealer){
                dealer.healRate += percent;
            }
        };
    },

    /**
     * ターン開始時にSGを回復するスキル.
     * @param {number} percent - 回復量が何％か指定する
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {PlayerSkill_skill} 生成されたスキル
     */
    SGHeal: function(percent, cap = null, desc = null){
        return {
            caption: cap || "浄化効果",
            desc: desc || `ターンの開始時にソウルジェムが${percent}％回復`,
            *effect(dealer){
                dealer.SGHealRate += percent;
            }
        };
    },

    /**
     * シールドを増やすスキル.
     * @param {number} n - シールドの増加量
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {PlayerSkill_skill} 生成されたスキル
     */
    addShield: function(n, cap = null, desc = null){
        return {
            caption: cap || "防御シールド",
            desc: desc || `敵の攻撃を${n}回防御`,
            *effect(dealer){
                yield* dealer.addShield(n);
            }
        };
    },

    /**
     * チャージMPを増加させるスキル.
     * @param {number} percent - 増加量が基本チャージMP (チャージボーナスを加算する前のMP合計値) の何％か指定する
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {PlayerSkill_skill} 生成されたスキル
     */
    chargeUp: function(percent, cap = null, desc = null){
        return {
            caption: cap || "チャージボーナス",
            desc: desc || `このターンのチャージMPを${percent}％アップ`,
            *effect(dealer){
                yield* dealer.chargeUp(percent);
            }
        };
    },

    /**
     * 残りHPが最大値の半分以下のときにMPを増加させるスキル.
     * @param {number} percent - 増加量が基本MPの何％か指定する
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {PlayerSkill_skill} 生成されたスキル
     */
    crisisBoost: function(percent, cap = null, desc = null){
        return {
            caption: cap || "ピンチでMPアップ",
            desc: desc || `残りHP50％以下でメインMP${percent}％上昇`,
            *effect(dealer){
                dealer.crisisBonus += percent;
                yield* dealer.crisisBoostTask(dealer.crisisBonus);
            }
        };
    },

    /**
     * 特定の属性のカード＆プレイヤーのMPを増加させるスキル.
     * @param {Array<string|number>} option - 「効果対象を説明する文字列,
     * 対象の属性のインデックス, 効果量をパーセントで表した値」をこの順番に並べた配列
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {PlayerSkill_skill} 生成されたスキル
     */
    suitSpecificBoost: function(option, cap = null, desc = null){
        const [str, mark, percent] = option;
        return {
            caption: cap || "属性強化",
            desc: desc || `${str}カードのMPが${percent}％アップ`,
            *effect(dealer){
                yield* dealer.suitSpecificBoost(str, Suits.indexOf(mark), percent);
            }
        };
    },

    /**
     * 敵にダメージを与えるスキル.
     * @param {number} percent - ダメージ量がプレイヤーのMPの何％か指定する
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {PlayerSkill_skill} 生成されたスキル
     */
    attack: function(percent, cap = null, desc = null){
        return {
            caption: cap || "強力な一撃",
            desc: desc || `MPの${percent}％ダメージ`,
            *effect(dealer){
                yield* dealer.damage(percent);
            }
        };
    },

    /**
     * 敵に複数回ダメージを与えるスキル.
     * @param {number[]} option - 「1回のダメージ量がプレイヤーMPの何％か指定する値」と
     * 「攻撃回数」をこの順番に並べた配列
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {PlayerSkill_skill} 生成されたスキル
     */
    multiAttack: function(option, cap = null, desc = null){
        const [percent, n] = option;
        return {
            caption: cap || "多段攻撃",
            desc: desc || `MPの${percent}％のダメージを${n}回与える`,
            *effect(dealer){
                for(let i = 0; i < n; i++){
                    yield* dealer.damage(percent);
                    if(dealer.enemyHP() <= 0) break;
                    else yield* dealer.wait(60);
                }
            }
        };
    },

    /**
     * 敵のMPを減少させるスキル.
     * @param {number} percent - 増加量が敵の基本MPの何％か指定する
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {PlayerSkill_skill} 生成されたスキル
     */
    reduceEnemyMP: function(percent, cap = null, desc = null){
        return {
            caption: cap || "敵MPの低下",
            desc: desc || `相手のMPを${percent}％減少`,
            *effect(dealer){
                yield* dealer.reduceEnemyMP(percent);
            }
        };
    },

    /**
     * 各ターンの制限時間を延長するスキル.
     * @param {number} n - 延長される秒数
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {PlayerSkill_skill} 生成されたスキル
     */
    extendTime: function(n, cap = null, desc = null){
        return {
            caption: cap || "制限時間延長",
            desc: desc || `制限時間を${n}秒延長`,
            *effect(dealer){
                yield* dealer.extendTime(n);
            }
        };
    },

    /**
     * HP, SGを全回復して1ターン目に戻すスキル.
     * @param {number} n - 使用しないが型を揃えるために存在している
     * @param {string} [cap=null] - スキル名. nullのときはデフォルトの名前が使われる
     * @param {string} [desc=null] - 効果の説明文. nullのときはデフォルトの説明が使われる
     * @returns {PlayerSkill_skill} 生成されたスキル
     */
    timeWarp: function(n, cap = null, desc = null){
        return {
            caption: cap || "時間跳躍",
            desc: desc || `HPとソウルジェムを回復しターン数回復`,
            *effect(dealer){
                yield* dealer.timeWarp();   // 引数は使わない
            }
        };
    }
};


// (b) 複合属性のカードの画像

/*
 * 基本属性のカードの画像は cardimages.png から読み込む.
 * 一方, 複合属性のカードの画像は, 各マークの画像を組み合わせて
 * プログラム内で生成する.
 */

/**
 * 複合属性のカードを描画するクラスの土台を提供する.
 * サブクラスは次のメソッドを実装する.
 * - paintBackground(ctx, marks)
 * - paintMark(ctx, pics)
 * - paintCost(ctx, x, y, marks, n)
 *
 * @class
 * @param {number} width - カードの横幅
 * @param {number} height - カードの縦幅
 * @param {stdgam.ImagePool} images - 必要な画像を読み込むために使うImagePool
 * @param {stdgam.CachePool} caches - 生成した画像を登録するために使うCachePool
 * @param {function(CanvasRenderingContext2D, number[]): void} paintBackground - カードの背景を描画する (サブクラスが実装する)
 * @param {function(CanvasRenderingContext2D, HTMLImageElement[]): void} paintMarks - カードのマークを描画する (サブクラスが実装する)
 * @param {function(CanvasRenderingContext2D, number, number, number[], number): void} paintCost - 
 * 指定された座標にカードの左上端があるものとしてカードのコストを描画する (サブクラスが実装する)
 */
class Polysuit{
    /**
     * 外枠などに使う配色.
     * @type {string[]}
     */
    static ccolors = [
        "rgb(204,96,96)", "rgb(17,17,119)", "rgb(96,96,204)",
        "rgb(192,192,0)", "rgb(186,115,87)", "rgb(207,141,154)"
    ];

    /**
     * カードの地の部分などに使う配色.
     * @type {string[]}
     */
    static wcolors = [
        "rgb(238,128,128)", "rgb(119,119,204)", "rgb(192,192,255)",
        "rgb(208,208,0)", "rgb(222,150,122)", "rgb(247,202,203)"
    ];

    /**
     * @param {stdgam.ImagePool} images - 必要な画像を読み込むために使うImagePool
     * @param {stdgam.CachePool} caches - 生成した画像を登録するために使うCachePool
     * @param {number} width - カードの横幅
     * @param {number} height - カードの縦幅
     */ 
    constructor(images, caches, width, height){
        this.images = images;
        this.caches = caches;
        this.width = width;
        this.height = height;
        for(let i = 0; i < Suits.length; i++){
            this.images.load(Suits[i], `./image/${Suits[i]}.png`);
        }
    }

    /**
     * グラデーションを作成する.
     * @param {CanvasRenderingContext2D} ctx - 描画処理に用いているコンテクスト
     * @param {string} c1 - 左上に設定する色
     * @param {string} c2 - 右下に設定する色
     * @param {number} [off1=0] - カードの左上の角よりも指定された値だけ外側に
     * 飛び出した場所を第1色の配置位置とする (x座標, y座標のそれぞれからoff1を引く)
     * @param {number} [off2=0] - カードの右下の角よりも指定された値だけ外側に
     * 飛び出した場所を第2色の配置位置とする (x座標, y座標のそれぞれにoff1を足す)
     * @param {string} [med=null] - 中間色を設定する場合はそのカラーコードを指定する
     * @returns {CanvasGradient} 作成されたグラデーション
     */
    gradation(ctx, c1, c2, off1=0, off2=0, med=null){
        const g = ctx.createLinearGradient(-off1, -off1, this.width+off2, this.height+off2);
        g.addColorStop(0, c1);
        if(med) g.addColorStop(0.5, med); 
        g.addColorStop(1, c2);
        return g;
    }

    /**
     * marksで指定された複合属性のカード画像が既に作成済みならそれを返す.
     * そうでない場合, サブクラスの
     * - this.paintBackgroud
     * - this.paintMark
     *
     * を使用してカード画像を作り, これをthis.cachesに登録する.
     * その後, 生成したカード画像を返す.
     * @param {number[]} marks - 含まれる基本属性をSuitsにおけるインデックスで指定したリスト
     * @returns {HTMLCanvasElement} その複合属性のカード画像
     */
    getCache(marks){
        const newName = getPolysuitName(marks);
        if(!this.caches.get(newName)){
            const pics = marks.map((m) => this.images.get(PrimitiveSuits[m]));
            const p = this.caches.createCache(newName, this.width, this.height, (ctx) => {
                ctx.save();
                this.paintBackground(ctx, marks);
                this.paintMark(ctx, pics);
                ctx.restore();
            });
        }
        return this.caches.get(newName);
    }
}

/**
 * 2つのマークを持つカードの画像を生成・管理するためのクラス.
 * @class
 * @param {number} width - カードの横幅
 * @param {number} height - カードの縦幅
 * @param {stdgam.ImagePool} images - 必要な画像を読み込むために使うImagePool
 * @param {stdgam.CachePool} caches - 生成した画像を登録するために使うCachePool
 */
class DuosuitGenerator extends Polysuit{
    /**
     * カードの背景を描画する.
     * @param {CanvasRenderingContext2D} ctx - 描画に使うコンテクスト
     * @param {number[]} marks - 含まれる基本属性をSuitsにおけるインデックスで指定したリスト
     */
    paintBackground(ctx, marks){
        ctx.save();
        const [m1, m2] = marks;
        ctx.fillStyle = this.gradation(ctx, Polysuit.ccolors[m1], Polysuit.ccolors[m2]);
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = this.gradation(ctx, Polysuit.wcolors[m1], Polysuit.wcolors[m2], 50, 250);
        ctx.fillRect(3, 3, this.width-6, this.height-6);
        ctx.restore();
    }

    /**
     * カードのマークを描画する.
     * @param {CanvasRenderingContext2D} ctx - 描画に使うコンテクスト
     * @param {HTMLImageElement[]} pics - 含まれる基本属性のマークの画像
     */
    paintMark(ctx, pics){
        ctx.save();
        const [img1, img2] = pics;
        const w = this.width * 0.7;
        const h = this.height * 0.7;
        ctx.drawImage(img1, 0, 0, this.width, this.height,
                      0, this.height*0.04, w, h);
        ctx.drawImage(img2, 0, 0, this.width, this.height,
                      this.width-w, this.height-h, w, h);
        ctx.restore();
    }

    /**
     * 指定された座標にカードの左上端があるものとしてカードのコストを描画する.
     * 他の描画メソッドとは違い, コストはキャッシュ画像には書き込まず,
     * PrismaticCardのpaintメソッドから毎フレーム呼び出される (さもなければ
     * キャッシュする画像の枚数がコストの種類数だけ倍増してしまう).
     * そのため, 基点となる(x,y)の情報が必要になる.
     * @param {CanvasRenderingContext2D} ctx - 描画に使うコンテクスト
     * @param {number} x - カードの配置位置のx座標
     * @param {number} y - カードの配置位置のy座標
     * @param {number[]} marks - 含まれる基本属性をSuitsにおけるインデックスで指定したリスト
     * @param {number} n - カードのコスト
     */
    paintCost(ctx, x, y, marks, n){
        ctx.save();
        const [m1, m2] = marks;
        ctx.strokeStyle = Polysuit.ccolors[m2];
        ctx.lineWidth = 4;
        ctx.fillStyle = "white";
        ctx.font = "italic bold 30px Serif";
        ctx.textAlign = "center";
        ctx.strokeText(`${n}`, x+this.width*0.8, y+10+this.height*0.8);
        ctx.fillText(`${n}`, x+this.width*0.8, y+10+this.height*0.8);
        ctx.restore();
    }
}

/**
 * 3つのマークを持つカードの画像を生成・管理するためのクラス.
 * @class
 * @param {number} width - カードの横幅
 * @param {number} height - カードの縦幅
 * @param {stdgam.ImagePool} images - 必要な画像を読み込むために使うImagePool
 * @param {stdgam.CachePool} caches - 生成した画像を登録するために使うCachePool
 */
class TriosuitGenerator extends Polysuit{
    /**
     * カードの背景を描画する.
     * @param {CanvasRenderingContext2D} ctx - 描画に使うコンテクスト
     * @param {number[]} marks - 含まれる基本属性をSuitsにおけるインデックスで指定したリスト
     */
    paintBackground(ctx, marks){
        ctx.save();
        const [m1, m2, m3] = marks;
        ctx.fillStyle = this.gradation(ctx, Polysuit.ccolors[m2], Polysuit.ccolors[m1], 0, 0);
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = this.gradation(ctx, Polysuit.wcolors[m1], Polysuit.wcolors[m3], 50, 250);
        ctx.fillRect(3, 3, this.width-6, this.height-6);
        ctx.restore();
    }

    /**
     * カードのマークを描画する.
     * @param {CanvasRenderingContext2D} ctx - 描画に使うコンテクスト
     * @param {HTMLImageElement[]} pics - 含まれる基本属性のマークの画像
     */
    paintMark(ctx, pics){
        ctx.save();
        const [img1, img2, img3] = pics;
        const w = this.width * 0.65;
        const h = this.height * 0.65;
        ctx.drawImage(img1, 0, 0, this.width, this.height,
                      this.width*0.35, 0, w, h);
        ctx.drawImage(img2, 0, 0, this.width, this.height,
                      0, this.height*0.15, w, h);
        ctx.drawImage(img3, 0, 0, this.width, this.height,
                      this.width*0.32, this.height*0.37, w, h);
        ctx.restore();
    }

    /**
     * 指定された座標にカードの左上端があるものとしてカードのコストを描画する.
     * 他の描画メソッドとは違い, コストはキャッシュ画像には書き込まず,
     * PrismaticCardのpaintメソッドから毎フレーム呼び出される (さもなければ
     * キャッシュする画像の枚数がコストの種類数だけ倍増してしまう).
     * そのため, 基点となる(x,y)の情報が必要になる.
     * @param {CanvasRenderingContext2D} ctx - 描画に使うコンテクスト
     * @param {number} x - カードの配置位置のx座標
     * @param {number} y - カードの配置位置のy座標
     * @param {number[]} marks - 含まれる基本属性をSuitsにおけるインデックスで指定したリスト
     * @param {number} n - カードのコスト
     */
    paintCost(ctx, x, y, marks, n){
        ctx.save();
        const [m1, m2, m3] = marks;
        ctx.strokeStyle = this.gradation(ctx, Polysuit.wcolors[m3], Polysuit.wcolors[m2], 0, 0);
        ctx.lineWidth = 4;
        ctx.fillStyle = "white";
        ctx.font = "italic bold 30px Serif";
        ctx.textAlign = "center";
        ctx.strokeText(`${n}`, x+this.width*0.8, y+10+this.height*0.8);
        ctx.fillText(`${n}`, x+this.width*0.8, y+10+this.height*0.8);
        ctx.restore();
    }
}

/**
 * 4つのマークを持つカードの画像を生成・管理するためのクラス.
 * @param {number} width - カードの横幅
 * @param {number} height - カードの縦幅
 * @param {stdgam.ImagePool} images - 必要な画像を読み込むために使うImagePool
 * @param {stdgam.CachePool} caches - 生成した画像を登録するために使うCachePool
 * @class
 */
class QuartetsuitGenerator extends Polysuit{
    /**
     * カードの背景を描画する.
     * @param {CanvasRenderingContext2D} ctx - 描画に使うコンテクスト
     * @param {number[]} marks - 含まれる基本属性をSuitsにおけるインデックスで指定したリスト
     */
    paintBackground(ctx, marks){
        ctx.save();
        const [m1, m2, m3, m4] = marks;
        ctx.fillStyle = this.gradation(ctx, Polysuit.wcolors[m2], Polysuit.wcolors[m4], 0, 0);
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = this.gradation(ctx, Polysuit.wcolors[m1], Polysuit.wcolors[m3], 50, 250);
        ctx.fillRect(3, 3, this.width-6, this.height-6);
        ctx.restore();
    }

    /**
     * カードのマークを描画する.
     * @param {CanvasRenderingContext2D} ctx - 描画に使うコンテクスト
     * @param {HTMLImageElement[]} pics - 含まれる基本属性のマークの画像
     */
    paintMark(ctx, pics){
        ctx.save();
        const [img1, img2, img3, img4] = pics;
        const w = this.width * 0.52;
        const h = this.height * 0.52;
        ctx.drawImage(img1, 0, 0, this.width, this.height,
                      this.width*0.25, -2, w, h);
        ctx.drawImage(img2, 0, 0, this.width, this.height,
                      0, this.height*0.25, w, h);
        ctx.drawImage(img3, 0, 0, this.width, this.height,
                      this.width*0.25, this.height*0.5, w, h);
        ctx.drawImage(img4, 0, 0, this.width, this.height,
                      this.width*0.5, this.height*0.25, w, h);
        ctx.restore();
    }

    /**
     * 指定された座標にカードの左上端があるものとしてカードのコストを描画する.
     * 他の描画メソッドとは違い, コストはキャッシュ画像には書き込まず,
     * PrismaticCardのpaintメソッドから毎フレーム呼び出される (さもなければ
     * キャッシュする画像の枚数がコストの種類数だけ倍増してしまう).
     * そのため, 基点となる(x,y)の情報が必要になる.
     * @param {CanvasRenderingContext2D} ctx - 描画に使うコンテクスト
     * @param {number} x - カードの配置位置のx座標
     * @param {number} y - カードの配置位置のy座標
     * @param {number[]} marks - 含まれる基本属性をSuitsにおけるインデックスで指定したリスト
     * @param {number} n - カードのコスト
     */
    paintCost(ctx, x, y, marks, n){
        ctx.save();
        const [m1, m2, m3, m4] = marks;
        ctx.strokeStyle = Polysuit.ccolors[m2];
        ctx.lineWidth = 4;
        ctx.fillStyle = "white";
        ctx.font = "italic bold 30px Serif";
        ctx.textAlign = "center";
        ctx.strokeText(`${n}`, x+this.width*0.8, y+10+this.height*0.8);
        ctx.fillText(`${n}`, x+this.width*0.8, y+10+this.height*0.8);
        ctx.restore();
    }
}

/**
 * 「魔法少女」のカードのうち, なぎさを含まないものについて
 * 画像を生成・管理するためのクラス.
 * @class
 * @param {number} width - カードの横幅
 * @param {number} height - カードの縦幅
 * @param {stdgam.ImagePool} images - 必要な画像を読み込むために使うImagePool
 * @param {stdgam.CachePool} caches - 生成した画像を登録するために使うCachePool
 */
class QuintetsuitGenerator extends Polysuit{
    /**
     * カードの背景を描画する.
     * @param {CanvasRenderingContext2D} ctx - 描画に使うコンテクスト
     * @param {number[]} marks - 含まれる基本属性をSuitsにおけるインデックスで指定したリスト
     */
    paintBackground(ctx, marks){
        ctx.save();
        ctx.fillStyle = this.gradation(ctx, Polysuit.wcolors[1], Polysuit.wcolors[2], 50, 250);
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = this.gradation(ctx, Polysuit.wcolors[0], Polysuit.wcolors[3], 50, 250);
        ctx.fillRect(3, 3, this.width-6, this.height-6);
        ctx.restore();
    }

    /**
     * カードのマークを描画する.
     * @param {CanvasRenderingContext2D} ctx - 描画に使うコンテクスト
     * @param {HTMLImageElement[]} pics - 含まれる基本属性のマークの画像
     */
    paintMark(ctx, pics){
        ctx.save();
        const [img1, img2, img3, img4, img5] = pics;
        const w = this.width * 0.5;
        const h = this.height * 0.5;
        ctx.drawImage(img1, 0, 0, this.width, this.height,
                      0, 0, w, h);
        ctx.drawImage(img2, 0, 0, this.width, this.height,
                      this.width*0.5, 0, w, h);
        ctx.drawImage(img3, 0, 0, this.width, this.height,
                      0, this.height*0.5, w, h);
        ctx.drawImage(img5, 0, 0, this.width, this.height,
                      this.width*0.5, this.height*0.5, w, h);
        ctx.drawImage(img4, 0, 0, this.width, this.height,
                      this.width*0.25, this.height*0.25, w, h);
        ctx.restore();
    }

    /**
     * 指定された座標にカードの左上端があるものとしてカードのコストを描画する.
     * 他の描画メソッドとは違い, コストはキャッシュ画像には書き込まず,
     * PrismaticCardのpaintメソッドから毎フレーム呼び出される (さもなければ
     * キャッシュする画像の枚数がコストの種類数だけ倍増してしまう).
     * そのため, 基点となる(x,y)の情報が必要になる.
     * @param {CanvasRenderingContext2D} ctx - 描画に使うコンテクスト
     * @param {number} x - カードの配置位置のx座標
     * @param {number} y - カードの配置位置のy座標
     * @param {number[]} marks - 含まれる基本属性をSuitsにおけるインデックスで指定したリスト
     * @param {number} n - カードのコスト
     */
    paintCost(ctx, x, y, marks, n){
        ctx.save();
        ctx.strokeStyle = Polysuit.ccolors[5];
        ctx.lineWidth = 4;
        ctx.fillStyle = "white";
        ctx.font = "italic bold 30px Serif";
        ctx.textAlign = "center";
        ctx.strokeText(`${n}`, x+this.width*0.8, y+10+this.height*0.8);
        ctx.fillText(`${n}`, x+this.width*0.8, y+10+this.height*0.8);
        ctx.restore();
    }

    /**
     * 魔法少女5人組のカード画像が既に作成済みならそれを返す.
     * そうでない場合, カード画像を生成してthis.cacheに登録する.
     * その後, 生成したカード画像を返す.
     *
     * Quintetの場合, marksとして何が渡された場合でも
     * 必ずmarksを [0, 1, 2, 3, 4] に置き換えて作業を行う (並び順が違うだけの
     * 画像を無駄に増やさないため).
     * @param {number[]} marks - 含まれる基本属性をSuitsにおけるインデックスで指定したリスト
     * @returns {HTMLCanvasElement} その複合属性のカード画像
     */
    getCache(marks){
        marks = [0, 1, 2, 3, 4];
        const newName = getPolysuitName(marks);
        if(!this.caches.get(newName)){
            const pics = marks.map((m) => this.images.get(PrimitiveSuits[m]));
            const p = this.caches.createCache(newName, this.width, this.height, (ctx) => {
                ctx.save();
                this.paintBackground(ctx, marks);
                this.paintMark(ctx, pics);
                ctx.restore();
            });
        }
        return this.caches.get(newName);
    }
}

/**
 * なぎさを含む「魔法少女」のカードの画像を生成・管理するためのクラス.
 * @class
 * @param {number} width - カードの横幅
 * @param {number} height - カードの縦幅
 * @param {stdgam.ImagePool} images - 必要な画像を読み込むために使うImagePool
 * @param {stdgam.CachePool} caches - 生成した画像を登録するために使うCachePool
 */
class SestetsuitGenerator extends Polysuit{
    /**
     * カードの背景を描画する.
     * @param {CanvasRenderingContext2D} ctx - 描画に使うコンテクスト
     * @param {number[]} marks - 含まれる基本属性をSuitsにおけるインデックスで指定したリスト
     */
    paintBackground(ctx, marks){
        ctx.save();
        ctx.fillStyle = this.gradation(ctx, Polysuit.wcolors[1], Polysuit.wcolors[2], 50, 250);
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = this.gradation(ctx, Polysuit.wcolors[0], Polysuit.wcolors[3], 50, 250);
        ctx.fillRect(3, 3, this.width-6, this.height-6);
        ctx.restore();
    }

    /**
     * カードのマークを描画する.
     * @param {CanvasRenderingContext2D} ctx - 描画に使うコンテクスト
     * @param {HTMLImageElement[]} pics - 含まれる基本属性のマークの画像
     */
    paintMark(ctx, pics){
        ctx.save();
        const [img1, img2, img3, img4, img5, img6] = pics;
        const w = this.width * 0.5;
        const h = this.height * 0.5;
        ctx.drawImage(img6, 0, 0, this.width, this.height,
                      0, this.height*0.12, w, h);
        ctx.drawImage(img2, 0, 0, this.width, this.height,
                      this.width*0.5, this.height*0.1, w, h);
        ctx.drawImage(img3, 0, 0, this.width, this.height,
                      0, this.height*0.38, w, h);
        ctx.drawImage(img5, 0, 0, this.width, this.height,
                      this.width*0.5, this.height*0.4, w, h);
        ctx.drawImage(img1, 0, 0, this.width, this.height,
                      this.width*0.25, this.height*0, w, h);
        ctx.drawImage(img4, 0, 0, this.width, this.height,
                      this.width*0.25, this.height*0.5, w, h);
        ctx.restore();
    }

    /**
     * 指定された座標にカードの左上端があるものとしてカードのコストを描画する.
     * 他の描画メソッドとは違い, コストはキャッシュ画像には書き込まず,
     * PrismaticCardのpaintメソッドから毎フレーム呼び出される (さもなければ
     * キャッシュする画像の枚数がコストの種類数だけ倍増してしまう).
     * そのため, 基点となる(x,y)の情報が必要になる.
     * @param {CanvasRenderingContext2D} ctx - 描画に使うコンテクスト
     * @param {number} x - カードの配置位置のx座標
     * @param {number} y - カードの配置位置のy座標
     * @param {number[]} marks - 含まれる基本属性をSuitsにおけるインデックスで指定したリスト
     * @param {number} n - カードのコスト
     */
    paintCost(ctx, x, y, marks, n){
        ctx.save();
        ctx.strokeStyle = Polysuit.ccolors[5];
        ctx.lineWidth = 4;
        ctx.fillStyle = "white";
        ctx.font = "italic bold 30px Serif";
        ctx.textAlign = "center";
        ctx.strokeText(`${n}`, x+this.width*0.8, y+10+this.height*0.8);
        ctx.fillText(`${n}`, x+this.width*0.8, y+10+this.height*0.8);
        ctx.restore();
    }

    /**
     * 魔法少女5人組のカード画像が既に作成済みならそれを返す.
     * そうでない場合, カード画像を生成してthis.cacheに登録する.
     * その後, 生成したカード画像を返す.
     *
     * Sestetの場合, marksとして何が渡された場合でも
     * 必ずmarksを [0, 1, 2, 3, 4, 5] に置き換えて作業を行う (並び順が違うだけの
     * 画像を無駄に増やさないため).
     * @param {number[]} marks - 含まれる基本属性をSuitsにおけるインデックスで指定したリスト
     * @returns {HTMLCanvasElement} その複合属性のカード画像
     */
    getCache(marks){
        marks = [0, 1, 2, 3, 4, 5];
        const newName = getPolysuitName(marks);
        if(!this.caches.get(newName)){
            const pics = marks.map((m) => this.images.get(PrimitiveSuits[m]));
            const p = this.caches.createCache(newName, this.width, this.height, (ctx) => {
                ctx.save();
                this.paintBackground(ctx, marks);
                this.paintMark(ctx, pics);
                ctx.restore();
            });
        }
        return this.caches.get(newName);
    }
}


// (c) カードを表すクラスの実装

/**
 * 基本属性を持つカードのクラス. 最初に Card.init(GE, width, height) を
 * 実行してからインスタンスの生成を行う.
 *
 * 各インスタンスは次のプロパティを持つ.
 * - mark
 * - value
 * - MP
 * - skill (任意)
 * - CardAtlassId (任意)
 *
 * (1) mark は, このカードの属性をSuitsにおけるインデックスで表した数値である.
 * 便宜上, このクラスのコメントでは「マーク数値」と略す.
 * mark の取りうる値は 0 ～ (PrimitiveSuits.length-1) の範囲の整数である.
 *
 * (2) value はカードの「コスト」を表す. 範囲チェック・整数チェックは行わないが,
 * 0 ～ 10 の範囲の整数であることを想定して扱われる.
 * (整数でないときの挙動は保証しない！)
 *
 * ただし, value == 0 のカードは「カードが存在しない」状態を表すインスタンスとして
 * 扱われる. たとえば, paintメソッドで何も描画されない.
 *
 * (3) MP はこのカードの基本攻撃力を表す. 実際はこの値を直接使うことは滅多に無く,
 * MPBoostBySuitの補正を施した値を getMP() メソッドで計算して使う.
 *
 * 以上の3要素はどんなインスタンスも必ず定義されている.
 * これに対し, 他の2つは定義されている場合も未定義の場合も両方ある.
 *
 * (4) skill はこのカードの持つスキルを表す.
 * 原則として PlayerSkill に属するいずれかの生成関数で作成されたオブジェクトを持つ.
 *
 * (5) CardAtlassID はcardlist.jsにおけるこのカードのIDである.
 * CardAtlasに登録されているカードには自動的に付与される.
 * @class
 * @prop {number} mark - このカードのマーク数値
 * @prop {number} value - このカードのコスト
 */
class Card{
    /**
     * スキル持ちカードのマーカーを表示する場合true, 表示しないときfalse.
     * このフラグはPrismaticCardからも参照される
     * @type {boolean}
     */
    static MarkerFlag = true;

    /**
     * Cardクラスを初期化する.
     * 具体的には, "CARDIMAGES"で登録されている画像をGE.imagesから読み込み,
     * stdgam.ImageCutterで分割する. 以降, これをカードの描画に用いる.
     * @param {stdgam.GameEngine} GE - 画像のロードに用いるGameEngine
     * @param {number} width - カードの横幅
     * @param {number} height - カードの縦幅
     */
    static init(GE, width, height){
        this.IC = new ImageCutter(GE.images.get("CARDIMAGES"), width, height);
        this.width = width;
        this.height = height;
    }

    /**
     * カードの整列に用いる比較関数.
     */
    static compare = function(c1, c2){
        if(c1.mark != c2.mark){
            return c1.mark - c2.mark;
        }
        return c1.value - c2.value;
    }

    /**
     * 指定されたマーク数値, コスト, MPを持つカードを生成する.
     * @param {number} [mark] - このカードのマーク数値
     * @param {number} [n=0] - このカードのコスト
     * @param {?number} [mp=null] - このカードのMP. 省略時は n*20 で代用する
     */
    constructor(mark = 0, n = 0, mp = null){
        this.mark = mark;
        this.mask = ChainMask[mark];
        this.value = n;
        this.MP = mp || n * 20;
    }

    /**
     * MPBoostBySuitの補正を適用した後のMPを計算する.
     * @returns {number} 計算結果
     */
    getMP(){
        return Math.floor(this.MP * MPBoostBySuit.get(this.mark));
    }

    /**
     * 指定された座標を左上端としてこのカードを描画する.
     * ただし, コストが 0 のカードは何も描画しない.
     * @param {stdgam.GameEngine} GE - この処理に用いるGameEngine
     * @param {CanvasRenderingContext2D} ctx - 描画処理に用いるコンテクスト
     * @param {number} x - 描画位置のx座標
     * @param {number} y - 描画位置のy座標
     */
    paint(GE, ctx, x, y){
        Card.IC.paint(ctx, x, y, this.value, this.mark);
        if(this.skill && Card.MarkerFlag){
            const indicator = this.version ? "*".repeat(this.version) : "*!";
            ctx.save();
            ctx.font = "bold 20px Sans-Serif";
            ctx.fillStyle = "white";
            ctx.fillText(indicator, x+Card.width*0.1, y+Card.height*0.2);
            ctx.restore();
        }
    }
}

/**
 * 複合属性を持つカードのクラス.
 * インスタンスの生成を行う前にPrismaticCardクラスの初期化を実行しないといけない.
 * 具体的には PrismaticCard.init(GE, width, height) を最初に実行する.
 * @class
 */
class PrismaticCard{
    static init(GE, width, height){
        PrismaticCard.generators = [
            new DuosuitGenerator(GE.images, GE.caches, width, height),
            new TriosuitGenerator(GE.images, GE.caches, width, height),
            new QuartetsuitGenerator(GE.images, GE.caches, width, height),
            new QuintetsuitGenerator(GE.images, GE.caches, width, height),
            new SestetsuitGenerator(GE.images, GE.caches, width, height)
        ];
    }

    constructor(marks, n, mp = null){
        const key = getPolysuitName(marks);
        if(!Suits.includes(key)){
            Suits.push(key);
            ChainMask.push(getPolysuitMask(marks));
        }
        this.components = marks;
        this.mark = Suits.indexOf(key);
        this.mask = ChainMask[this.mark];
        this.value = n;
        this.MP = mp || n * 20;

        this.generator = PrismaticCard.generators[marks.length-2];
        this.image = this.generator.getCache(marks);
    }

    getMP(){
        return Math.floor(this.MP * MPBoostBySuit.get(this.mark));
    }

    paint(GE, ctx, x, y){
        ctx.save();
        ctx.drawImage(this.image, x, y);
        this.generator.paintCost(ctx, x, y, this.components, this.value);
        if(this.skill && Card.MarkerFlag){
            ctx.save();
            const indicator = this.version ? "*".repeat(this.version) : "*!";
            ctx.font = "bold 20px Sans-Serif";
            ctx.fillStyle = "white";
            ctx.fillText(indicator, x+Card.width*0.1, y+Card.height*0.2);
            ctx.restore();
        }
        ctx.restore();
    }
}


// #3. カードに関連するクラス

/*
 * カードの集合にはいくつか種類がある.
 * (1) 単なる配列 (Array)
 *     主に cards などのように表す.
 * (2) CardSet
 *     要素の重複がなく Card.compare でソートされたコレクション.
 *     主に cardset または deckSet のように表す.
 * (3) Deck
 *     shift() や shuffle() などバトルに必要な機能を持たせたコレクション.
 *     主に deck または deckObj のように表す.
 */

/**
 * 重複を持たずソートされたカードの集合を表すクラス.
 * @class
 */
class CardSet{
    static NullCard = new Card(0, 0);

    constructor(cards){
        this.init(cards);
    }

    init(cards){
        this.cards = [...cards];
        this.cards.sort(Card.compare);
    }

    size(){
        return this.cards.length;
    }

    watch(n){
        if(n < this.cards.length) return this.cards[n];
        return CardSet.NullCard;
    }

    push(card){
        this.cards.push(card);
        this.cards.sort(Card.compare);
    }

    slice(n){
        const card = this.watch(n);
        this.cards.splice(n, 1);
        return card;
    }
}

/**
 * バトルで使うデッキを実装するクラス.
 * @class
 */
class Deck{
    // cardsに格納されているカード達をそのままの並び順で使う
    // （shallow copyをとる）
    constructor(cards){
        this.cards = [...cards];
    }

    clone(){
        return new Deck(this.cards);
    }

    size(){
        return this.cards.length;
    }

    isEmpty(){
        return this.cards.length == 0;
    }

    shift(){
        if(this.isEmpty()){
            return new Card();
        }
        const card = this.cards[0];
        this.cards.splice(0, 1);
        return card;
    }

    remove(card){
        this.cards = this.cards.filter((e) => e !== card);
    }

    watch(i){
        if(this.cards.length <= i){
            return new Card();
        }
        return this.cards[i];
    }

    shuffle(){
        let i, len;
        i = this.cards.length;
        while(i > 0){
            let j = Math.floor(Math.random()*i);
            let t = this.cards[(--i)];
            this.cards[i] = this.cards[j];
            this.cards[j] = t;
        }
    }
}

/**
 * 場に出されたカードを管理するクラス.
 * class
 */
class Pool{
    constructor(version = 1){
        this.init();
        this.skills = [];
        this.ChainFunc = (version == 1 ? ChainFunc : ChainFuncVer2);
    }

    // カードの枚数
    size(){
        return this.cards.length;
    }

    // ターンが切り替わったときの処理
    // (前ターンに成立したスキルは持ち越される)
    init(){
        this.chargedMP = 0;
        this.baseMP = 0;
        this.chargeBonus = 0;
        this.cards = [];
        this.hyped = false;
    }

    // chargeMPを更新する
    // （chargeBonusを変更してもこの関数を呼ぶまでは更新されない！）
    applyBonus(){
        const v = Math.floor(this.baseMP * this.chargeBonus / 100);
        this.chargedMP = this.baseMP + v;
    }

    // MPを再計算する
    // （MPBoostBySuitが変更された場合などに使用する）
    recalculate(){
        this.baseMP = 0;
        for(const card of this.cards){
            this.baseMP += card.getMP();
        }
        this.applyBonus();
    }

    // 場にカードを出す. 具体的には,
    // (1) baseMPを増加させる
    // (2) chargeMPをボーナス適用前の値に戻す
    // (3) cardをカードリストに追加する
    // (4) コンボの判定を行い, 成立時はcard.skillをスキルリストに追加する
    //     （このときhypeの値も更新する）
    push(card){
        if(card.value == 0) return;
        this.baseMP += card.getMP();
        this.chargedMP = this.baseMP;
        this.cards.push(card);
        const len = this.cards.length;
        this.hyped = 
            (len >= 3 && this.ChainFunc(this.cards[len-3], this.cards[len-2], card)
                      && card.skill);
        if(this.hyped){
            this.skills.push(card.skill);
        }
    }

    // i番目のカード（該当するカードが無いときは Card(0, 0) を返す）
    watch(i){
        if(this.cards.length <= i){
            return new Card(0, 0);
        }
        return this.cards[i];
    }

    // 追加スキャンのためのメソッド.
    // この場合, １枚だけでもコンボ成立扱いになる
    extraScan(card){
        if(card.value == 0) return;
        this.push(card);
        this.hyped = true;  // 追加スキャンはスキルが発動
        this.skills.push(card.skill);
    }
}


// #4. カードデータベース

/*
 * cardlist.jsをロードすると RAW_CARD_DATA にカード情報が格納される.
 * これを元にカードのデータベースを作成する.
 */

/**
 * RAW_CARD_DATAに格納されているカード情報からカードを生成するオブジェクト.
 * 以下のメソッドを持つ.
 * get(id) : 指定されたカードIDのカードを返す
 * forEach(callback) : すべてのカード x に対して callback(x) を実行する
 *
 * CardAtlasにより生成されたCardオブジェクトはcardAtlasID属性に
 * カードのIDを代入される
 * @type {Object}
 */
const CardAtlas = {
    parseSuitString(ss){
        if(ss == "Quintet") return [0, 1, 2, 3, 4];  // 5人の魔法少女
        if(ss == "Sestet") return [0, 1, 2, 3, 4, 5];  // 6人の魔法少女
        const splitted = ss.match(/.{1,2}/g);
        return splitted.map((e) => {
            const i = PrimitiveSuits.indexOf(e);
            if(i >= 0) return i;
            else return 5;  // "Bb" と"Re" は「なぎさ」として扱う
        });
    },

    setSkill(card, sub){
        if(!sub) return;
        const info = sub.nagibato_code;
        const fn = PlayerSkill[info[0]];
        if(!fn) throw new Error(`PlayerSkill.${info[0]}は未実装です`);
        card.skill = fn(...info.slice(1));
    },

    init(){
        if(!RAW_CARD_DATA) throw new Error("'cardlist.js' が読み込まれていません");
        const _data = {};
        for(const item of RAW_CARD_DATA){
            let card;

            const marks = this.parseSuitString(item.suit_string);
            const mp = Math.floor(item.MP / 10);  // サブカードとして使うので
            if(marks.length == 1){
                card = new Card(marks[0], item.cost, mp);
            }
            else{
                card = new PrismaticCard(marks, item.cost, mp);
            }
            card.cardAtlasID = item.id;
            card.version = parseInt(item.id[0]);
            this.setSkill(card, item.sub);
            _data[item.id] = card;
        }

        this.get = (id) => { return _data[id]; };
        this.forEach = (callback) => {
            for(const key in _data){ callback(_data[key]); }
        };
    }
};
