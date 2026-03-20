/*
 * カードに関連するオブジェクトの実装
 */


// Chapter 1. 属性の定義・実装

/*
 * カードは「属性」と「数字」を持つ。
 * このうち、属性はさらに「基本属性」と「複合属性」に分かれる。
 *
 * 基本属性は PrimitiveSuits で定義される。
 * また、 Suits にも初期値としてこれらの値が格納される。
 * 複合属性はそれが必要になったとき自動的に Suits に追加される。
 *
 * 現実には、属性の値そのものを直接扱うことは少なく、
 * 多くは「 Suits 内におけるその属性のインデックス」を利用するが、
 * ファイル名の生成や ImagePool などで使う文字列キーの生成では
 * 属性の値自体を直接使う。
 *
 * また、コンボの判定に使うデータを ChainMask に格納する。
 * 複合属性が Suits に追加されるとき ChainMask にも適切な値が追加される。
 * これらの値を使ってコンボの判定を行う関数が ChainFunc に設定される。
 */

const PrimitiveSuits = [ "Md", "Hm", "Sy", "Mm", "Ky", "Ng" ];
const ChainMask = [ 1, 2, 4, 8, 16, 32 ];
const Suits = [...PrimitiveSuits];

const CharacterNames = {
    Md: "鹿目まどか",  Hm: "暁美ほむら",  Sy: "美樹さやか",  Mm: "巴マミ",
    Ky: "佐倉杏子",  Ng: "百江なぎさ"
};
const ShortCharacterNames ={
    Md: "まどか",  Hm: "ほむら",  Sy: "さやか",  Mm: "マミ",
    Ky: "杏子",  Ng: "なぎさ"
};
const getCharacterName = function(suitString){
    if(suitString.length >= 10) return "魔法少女";
    if(suitString.length == 2) return CharacterNames[suitString];
    const splitted = suitString.match(/.{1,2}/g);
    return splitted.map((e) => ShortCharacterNames[e]).join("＆");
}


/**
 * 3枚のカードがコンボの条件を満たしているか判定する
 * （ただし、3枚目のカードがスキルを持つかどうかはチェックしない）。
 * コンボの成立条件はバージョンによって異なるため、
 * 採用するルールに応じてこれらの関数を使うこと。
 */
const ChainFunc = function(a, b, c){
    return ((a.mask & c.mask) == a.mask) && ((b.mask & c.mask) == b.mask);
}

const ChainFuncVer2 = function(a, b, c){
    if(c.mark < PrimitiveSuits.length){
        return ((a.mark == b.mark) && (b.mark == c.mark));
    }
    else{
        return (a.mark >= PrimitiveSuits.length)
               && (b.mark >= PrimitiveSuits.length);
    }
}

/**
 * 複合クラスの属性名を生成する
 * (構成要素は「PrimitiveSuitsにおけるインデックス」で指定する)
 */
const getPolysuitName = function(marks){
    const names = marks.map((m) => PrimitiveSuits[m]);
    return names.join("");
}

/**
 * 複合クラスのためのマスクを計算する
 * (構成要素は「PrimitiveSuitsにおけるインデックス」で指定する)
 */
const getPolysuitMask = function(indices){
    let m = 0;
    for(const i of indices) m |= ChainMask[i];
    return m;
}

/**
 * 一部のスキル（敵スキルを含む）では「特定の属性だけMPが増加」のように
 * 属性ごとに影響の違う効果を引き起こすことがある。
 * これを管理するため、各属性の強化倍率を扱うオブジェクトを用意する。
 * （複合属性は全部ひとまとめにして扱う）
 */
const MPBoostBySuit = {
    primitive: PrimitiveSuits.map((e) => 100),
    prismatic: 100,

    // 初期化
    init(){
        this.primitive.fill(100);
        this.prismatic = 100;
    },

    // Suit[m]に対する強化倍率を計算する。
    // 複合属性は基本的に白属性（prismatic）として扱われるが、
    // "Ng" を含むものは例外的に "Ng" として扱う（理由は不明・・・）
    get(m){
        if(ChainMask[m] & ChainMask[5]) m = 5;
        return (this.primitive[m] ?? this.prismatic) / 100;
    }
};


// Chapter 2. カード、およびカードに関連する機能

/*--- 1. スキルとその実行インターフェース ---*/

/**
 * プレイヤー側のスキルの効果を実装するためオブジェクト。
 * これ自体はごく限定された機能しか持っておらず、
 * 各スキル効果の具体的な処理内容はサブクラスで実装する。
 */
class SkillDealerBase{
/*
    // サブクラスが実装する処理 (基本情報)
    enemyHP(){ }

    // サブクラスが実装する処理 (攻撃時に実行)
    *addHP(percent){ }
    *addMP(percent){ }
    *addSG(percent){ }
    *addHPSG(percent){ }
    *addShield(n){ }
    *chargeUp(percent){ }
    *reduceEnemyMP(percent){ }
    *suitSpecificBoost(str, mark, percent){ }
    *damage(percent){ }
    *extendTime(n){ }
    *timeWarp(){ }

    // サブクラスが実装する処理 (ターン開始時に実行)
    *heal(percent){ }
    *SGHeal(percent){ }

    // サブクラスが実装する処理 (HPの変化に伴い呼び出される)
    *crisisBoostTask(percent){ }
*/

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
        // healが実行されない場合、crisisBoostのHPチェックを自分で実行
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
 * プレイヤー側のスキルを生成する関数をまとめたもの。
 */
const PlayerSkill = {
    addHP: function(percent, cap = null, desc = null){
        return {
            caption: cap || "体力回復",
            desc: desc || `HPを${percent}％回復`,
            *effect(dealer){
                yield* dealer.addHP(percent);
            }
        };
    },

    addMP: function(percent, cap = null, desc = null){
        return {
            caption: cap || "MPアップ",
            desc: desc || `メインカードMPが${percent}％アップ`,  // 「の」が入らないみたい
            *effect(dealer){
                yield* dealer.addMP(percent);
            }
        };
    },

    addSG: function(percent, cap = null, desc = null){
        return {
            caption: cap || "ソウルジェム回復",
            desc: desc || `ソウルジェムを${percent}％回復`,
            *effect(dealer){
                yield* dealer.addSG(percent);
            }
        };
    },

    addHPSG: function(percent, cap = null, desc = null){
        return {
            caption: cap || "HPとソウルジェムを回復",
            desc: desc || `HPとソウルジェムを${percent}％回復`,
            *effect(dealer){
                yield* dealer.addHPSG(percent);
            }
        };
    },

    heal: function(percent, cap = null, desc = null){
        return {
            caption: cap || "癒し効果",
            desc: desc || `ターンの開始時にHPが${percent}％回復`,
            *effect(dealer){
                dealer.healRate += percent;
            }
        };
    },

    SGHeal: function(percent, cap = null, desc = null){
        return {
            caption: cap || "浄化効果",
            desc: desc || `ターンの開始時にソウルジェムが${percent}％回復`,
            *effect(dealer){
                dealer.SGHealRate += percent;
            }
        };
    },

    addShield: function(n, cap = null, desc = null){
        return {
            caption: cap || "防御シールド",
            desc: desc || `敵の攻撃を${n}回防御`,
            *effect(dealer){
                yield* dealer.addShield(n);
            }
        };
    },

    chargeUp: function(percent, cap = null, desc = null){
        return {
            caption: cap || "チャージボーナス",
            desc: desc || `このターンのチャージMPを${percent}％アップ`,
            *effect(dealer){
                yield* dealer.chargeUp(percent);
            }
        };
    },

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

    attack: function(percent, cap = null, desc = null){
        return {
            caption: cap || "強力な一撃",
            desc: desc || `MPの${percent}％ダメージ`,
            *effect(dealer){
                yield* dealer.damage(percent);
            }
        };
    },

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

    reduceEnemyMP: function(percent, cap = null, desc = null){
        return {
            caption: cap || "敵MPの低下",
            desc: desc || `相手のMPを${percent}％減少`,
            *effect(dealer){
                yield* dealer.reduceEnemyMP(percent);
            }
        };
    },

    extendTime: function(n, cap = null, desc = null){
        return {
            caption: cap || "制限時間延長",
            desc: desc || `制限時間を${n}秒延長`,
            *effect(dealer){
                yield* dealer.extendTime(n);
            }
        };
    },

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


/*--- 2. カードを表すオブジェクトの生成 ---*/

class Polysuit{
/*
    // サブクラスが実装する処理
    paintBackground(ctx, marks){ }
    paintMark(ctx, pics){ }
    paintCost(ctx, x, y, marks, n){ }
*/

    static ccolors = [
        "rgb(204,96,96)", "rgb(17,17,119)", "rgb(96,96,204)",
        "rgb(192,192,0)", "rgb(186,115,87)", "rgb(207,141,154)"
    ];

    static wcolors = [
        "rgb(238,128,128)", "rgb(119,119,204)", "rgb(192,192,255)",
        "rgb(208,208,0)", "rgb(222,150,122)", "rgb(247,202,203)"
    ];

    constructor(images, caches, width, height){
        this.images = images;
        this.caches = caches;
        this.width = width;
        this.height = height;
        for(let i = 0; i < Suits.length; i++){
            this.images.load(Suits[i], `./image/${Suits[i]}.png`);
        }
    }

    gradation(ctx, c1, c2, off1=0, off2=0, med=null){
        const g = ctx.createLinearGradient(-off1, -off1, this.width+off2, this.height+off2);
        g.addColorStop(0, c1);
        if(med) g.addColorStop(0.5, med); 
        g.addColorStop(1, c2);
        return g;
    }

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
 * 2つのマークを持つカードの画像を生成・管理するためのクラス
 */
class DuosuitGenerator extends Polysuit{
    paintBackground(ctx, marks){
        const [m1, m2] = marks;
        ctx.fillStyle = this.gradation(ctx, Polysuit.ccolors[m1], Polysuit.ccolors[m2]);
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = this.gradation(ctx, Polysuit.wcolors[m1], Polysuit.wcolors[m2], 50, 250);
        ctx.fillRect(3, 3, this.width-6, this.height-6);
    }

    paintMark(ctx, pics){
        const [img1, img2] = pics;
        const w = this.width * 0.7;
        const h = this.height * 0.7;
        ctx.drawImage(img1, 0, 0, this.width, this.height,
                      0, this.height*0.04, w, h);
        ctx.drawImage(img2, 0, 0, this.width, this.height,
                      this.width-w, this.height-h, w, h);
    }

    paintCost(ctx, x, y, marks, n){
        const [m1, m2] = marks;
        ctx.strokeStyle = Polysuit.ccolors[m2];
        ctx.lineWidth = 4;
        ctx.fillStyle = "white";
        ctx.font = "italic bold 30px Serif";
        ctx.textAlign = "center";
        ctx.strokeText(`${n}`, x+this.width*0.8, y+10+this.height*0.8);
        ctx.fillText(`${n}`, x+this.width*0.8, y+10+this.height*0.8);
    }
}

/**
 * 3つのマークを持つカードの画像を生成・管理するためのクラス
 */
class TriosuitGenerator extends Polysuit{
    paintBackground(ctx, marks){
        const [m1, m2, m3] = marks;
        ctx.fillStyle = this.gradation(ctx, Polysuit.ccolors[m2], Polysuit.ccolors[m1], 0, 0);
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = this.gradation(ctx, Polysuit.wcolors[m1], Polysuit.wcolors[m3], 50, 250);
        ctx.fillRect(3, 3, this.width-6, this.height-6);
    }

    paintMark(ctx, pics){
        const [img1, img2, img3] = pics;
        const w = this.width * 0.65;
        const h = this.height * 0.65;
        ctx.drawImage(img1, 0, 0, this.width, this.height,
                      this.width*0.35, 0, w, h);
        ctx.drawImage(img2, 0, 0, this.width, this.height,
                      0, this.height*0.15, w, h);
        ctx.drawImage(img3, 0, 0, this.width, this.height,
                      this.width*0.32, this.height*0.37, w, h);
    }

    paintCost(ctx, x, y, marks, n){
        const [m1, m2, m3] = marks;
        ctx.strokeStyle = this.gradation(ctx, Polysuit.wcolors[m3], Polysuit.wcolors[m2], 0, 0);
        ctx.lineWidth = 4;
        ctx.fillStyle = "white";
        ctx.font = "italic bold 30px Serif";
        ctx.textAlign = "center";
        ctx.strokeText(`${n}`, x+this.width*0.8, y+10+this.height*0.8);
        ctx.fillText(`${n}`, x+this.width*0.8, y+10+this.height*0.8);
    }
}

/**
 * 4つのマークを持つカードの画像を生成・管理するためのクラス
 */
class QuartetsuitGenerator extends Polysuit{
    paintBackground(ctx, marks){
        const [m1, m2, m3, m4] = marks;
        ctx.fillStyle = this.gradation(ctx, Polysuit.wcolors[m2], Polysuit.wcolors[m4], 0, 0);
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = this.gradation(ctx, Polysuit.wcolors[m1], Polysuit.wcolors[m3], 50, 250);
        ctx.fillRect(3, 3, this.width-6, this.height-6);
    }

    paintMark(ctx, pics){
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
    }

    paintCost(ctx, x, y, marks, n){
        const [m1, m2, m3, m4] = marks;
        ctx.strokeStyle = Polysuit.ccolors[m2];
        ctx.lineWidth = 4;
        ctx.fillStyle = "white";
        ctx.font = "italic bold 30px Serif";
        ctx.textAlign = "center";
        ctx.strokeText(`${n}`, x+this.width*0.8, y+10+this.height*0.8);
        ctx.fillText(`${n}`, x+this.width*0.8, y+10+this.height*0.8);
    }
}

/**
 * 「魔法少女」のカードの画像を生成・管理するためのクラス
 * （なぎさを含むものは別のクラスで対応する）
 */
class QuintetsuitGenerator extends Polysuit{
    paintBackground(ctx, marks){
        ctx.fillStyle = this.gradation(ctx, Polysuit.wcolors[1], Polysuit.wcolors[2], 50, 250);
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = this.gradation(ctx, Polysuit.wcolors[0], Polysuit.wcolors[3], 50, 250);
        ctx.fillRect(3, 3, this.width-6, this.height-6);
    }

    paintMark(ctx, pics){
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
    }

    paintCost(ctx, x, y, marks, n){
        ctx.strokeStyle = Polysuit.ccolors[5];
        ctx.lineWidth = 4;
        ctx.fillStyle = "white";
        ctx.font = "italic bold 30px Serif";
        ctx.textAlign = "center";
        ctx.strokeText(`${n}`, x+this.width*0.8, y+10+this.height*0.8);
        ctx.fillText(`${n}`, x+this.width*0.8, y+10+this.height*0.8);
    }

    // 必ず [0, 1, 2, 3, 4] で固定する
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
 * なぎさを含む「魔法少女」のカードの画像を生成・管理するためのクラス
 */
class SestetsuitGenerator extends Polysuit{
    paintBackground(ctx, marks){
        ctx.fillStyle = this.gradation(ctx, Polysuit.wcolors[1], Polysuit.wcolors[2], 50, 250);
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = this.gradation(ctx, Polysuit.wcolors[0], Polysuit.wcolors[3], 50, 250);
        ctx.fillRect(3, 3, this.width-6, this.height-6);
    }

    paintMark(ctx, pics){
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
    }

    paintCost(ctx, x, y, marks, n){
        ctx.strokeStyle = Polysuit.ccolors[5];
        ctx.lineWidth = 4;
        ctx.fillStyle = "white";
        ctx.font = "italic bold 30px Serif";
        ctx.textAlign = "center";
        ctx.strokeText(`${n}`, x+this.width*0.8, y+10+this.height*0.8);
        ctx.fillText(`${n}`, x+this.width*0.8, y+10+this.height*0.8);
    }

    // 必ず [0, 1, 2, 3, 4, 5] で固定する
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

/**
 * 基本属性を持つカードを実装するクラス。
 * インスタンスの生成を行う前にCardクラスの初期化を実行しないといけない。
 * 具体的には Card.init(GE, width, height) を最初に実行する
 */
class Card{
    static init(GE, width, height){
        this.IC = new ImageCutter(GE.images.get("CARDIMAGES"), width, height);
        this.width = width;
        this.height = height;
    }

    static compare = function(c1, c2){
        if(c1.mark != c2.mark){
            return c1.mark - c2.mark;
        }
        return c1.value - c2.value;
    }

    constructor(mark = 0, n = 0, mp = null){
        this.mark = mark;
        this.mask = ChainMask[mark];
        this.value = n;
        this.MP = mp || n * 20;
    }

    getMP(){
        return Math.floor(this.MP * MPBoostBySuit.get(this.mark));
    }

    paint(GE, ctx, x, y){
        Card.IC.paint(ctx, x, y, this.value, this.mark);
        if(this.skill){
            ctx.save();
            ctx.font = "bold 20px Sans-Serif";
            ctx.fillStyle = "white";
            ctx.fillText("*", x+Card.width*0.1, y+Card.height*0.2);
            ctx.restore();
        }
    }
}

/**
 * 複合属性を持つカードを実装するクラス
 * （現時点ではまだマークが２つのカードだけ対応）。
 * インスタンスの生成を行う前にPrismaticCardクラスの初期化を実行しないといけない。
 * 具体的には PrismaticCard.init(GE, width, height) を最初に実行する
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
        if(this.skill){
            ctx.font = "bold 20px Sans-Serif";
            ctx.fillStyle = "white";
            ctx.fillText("*", x+Card.width*0.1, y+Card.height*0.2);
        }
        ctx.restore();
    }
}


/*--- 3. カードに関連するクラス ---*/

/*
 * カードの集合にはいくつか種類がある。
 * (1) 単なる配列 (Array)
 *     主に cards などのように表す。
 * (2) CardSet
 *     要素の重複がなく Card.compare でソートされたコレクション。
 *     主に cardset または deckSet のように表す。
 * (3) Deck
 *     shift() や shuffle() などバトルに必要な機能を持たせたコレクション。
 *     主に deck または deckObj のように表す。
 */

/**
 * 重複を持たずソートされたカードの集合を表すクラス
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
 * バトルで使うデッキを実装するクラス
 * （現時点では「巻き戻し」に未対応）
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
 * 場に出されたカードを管理するクラス
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

    // 場にカードを出す。具体的には、
    // (1) baseMPを増加させる
    // (2) chargeMPをボーナス適用前の値に戻す
    // (3) cardをカードリストに追加する
    // (4) コンボの判定を行い、成立時はcard.skillをスキルリストに追加する
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

    // 追加スキャンのためのメソッド。
    // この場合、１枚だけでもコンボ成立扱いになる
    extraScan(card){
        if(card.value == 0) return;
        this.push(card);
        this.hyped = true;  // 追加スキャンはスキルが発動
        this.skills.push(card.skill);
    }
}


// Chapter 3. カードデータベース

/*
 * cardlist.jsをロードすると RAW_CARD_DATA にカード情報が格納される。
 * これを元にカードのデータベースを作成する
 */

/**
 * RAW_CARD_DATAに格納されているカード情報からカードを生成するオブジェクト。
 * 以下のメソッドを持つ。
 * get(id) : 指定されたカードIDのカードを返す
 * forEach(callback) : すべてのカード x に対して callback(x) を実行する
 *
 * CardAtlasにより生成されたCardオブジェクトはcardAtlasID属性に
 * カードのIDを代入される
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
            this.setSkill(card, item.sub);
            _data[item.id] = card;
        }

        this.get = (id) => { return _data[id]; };
        this.forEach = (callback) => {
            for(const key in _data){ callback(_data[key]); }
        };
    }
};
