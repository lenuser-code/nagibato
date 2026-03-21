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
 * @returns {Object} 生成されたMeterオブジェクト
 */
createMeter = function(v, max, frames){
    let sv = v, tv = v, duration = 0, elapsed = 0;
    return {
        value: v, max: max, active: true,
        init(newValue, newMax){
            tv = newValue; this.value = newValue; this.max = newMax;
            duration = 0; elapsed = 0;
        },
        changeTo(target, dur = frames, debug=false){
            sv = this.value;
            tv = target;
            duration = dur; elapsed = 0;
        },
        execute(GE){
            if(elapsed < duration){
                elapsed++;
                const t = (elapsed < duration) ? ((duration - elapsed) / duration) : 0;
                const v = Math.floor(tv - (tv - sv) * t);
                this.value = Math.max(0, Math.min(this.max, v));
            }
            else this.debug = false;
            return true;
        }
    };
}

// #2. Player, Enemy

/**
 * HP, MP, nameを持つオブジェクトのためのクラス.
 * ただし, 実際はカプセル化しているのでメソッドでアクセスする.
 * - HP()
 * - MP()
 * - addHP(v)
 * - addMP(v)
 * - percentHP(p)
 * - percentMP(p)
 * - retentionRateHP()
 * - retentionRateMP()
 *
 * また, HPに対してHPMeter, MPに対してMPMeterも同時に用意する.
 * この2つは公開されている.
 * @class
 */
class BasicStatus{
    init(maxHP, defaultMP, name){
        const S = {
            HP: maxHP, maxHP: maxHP, MP: defaultMP, defaultMP: defaultMP,
            name: name
        };
        this.HPMeter = this.HPMeter || createMeter(maxHP, maxHP, 60);
        this.MPMeter = this.MPMeter || createMeter(defaultMP, 99999, 60);

        this.name = () => S.name;
        this.HP = () => S.HP;
        this.MP = () => S.MP;
        this.percentHP = (p) => Math.floor(S.maxHP * p / 100);
        this.percentMP = (p) => Math.floor(S.defaultMP * p / 100);
        this.retentionRateHP = () => (S.HP / S.maxHP);
        this.retentionRateMP = () => (S.MP / S.defaultMP);

        this.HPMeter.init(maxHP, maxHP);
        this.MPMeter.init(defaultMP, 99999);
        this.bind = (scene) => {
            scene.add(this.HPMeter);
            scene.add(this.MPMeter);
        };

        this.addHP = (v) => {
            S.HP += v;
            this.HPMeter.changeTo(S.HP, 60);
            if(S.HP < 0) S.HP = 0;
            if(S.HP > S.maxHP) S.HP = S.maxHP;
        }
        this.addMP = (v) => {
            S.MP += v;
            this.MPMeter.changeTo(S.MP, 60);
            if(S.MP < 0) S.MP = 1;
        }
    }
}

/**
 * プレイヤーのステータスを保持するクラス.
 * HP, MP, nameに加えて, 以下のステータスを持つ.
 * - mainSkill
 * - mainSkillCount
 * - mark
 * - SG
 * - shield
 * - stun
 * - suitString
 *
 * @class
 */
class Player extends BasicStatus{
    parseMainSkill(opt){
        if(!opt.main) return null;
        const info = opt.main.nagibato_code;
        const fn = PlayerSkill[info[0]];
        if(!fn) throw new Error(`PlayerSkill.${info[0]}は未実装です`);
        return fn(...info.slice(1));
    }

    init(opt){
        const maxHP = opt.HP, defaultMP = opt.MP, name = opt.character;
        super.init(maxHP, defaultMP, name);
        let SG = 100;
        let shield = 0;
        let stun = 0;
        let suitString = opt.suit_string;
        let mark = Suits.indexOf(suitString);
        let mainSkill = this.parseMainSkill(opt);
        let mainSkillCount = (mainSkill ? 1 : 0);
        const id = opt.id;

        this.mainSkillCount = () => mainSkillCount;
        this.shiftMainSkill = () => {
            if(mainSkillCount == 0) return null;
            mainSkillCount--;
            return mainSkill;
        };

        this.SGMeter = this.SGMeter || createMeter(100, 100, 60);
        this.SGMeter.init(100, 100);
        const tmp = this.bind;
        this.bind = (scene) => {
            tmp(scene);
            scene.add(this.SGMeter);
        };

        this.SG = () => SG;
        this.addSG = (v, frames=60) => {
            SG += v;
            this.SGMeter.changeTo(SG, frames);
            if(SG < 0) SG = 0;
            if(SG > 100) SG = 100;
        }
        this.resetSG = () => {
            SG = 100;
            this.SGMeter.changeTo(100, 60);
        }

        this.shield = () => shield;
        this.addShield = (v) => { shield = Math.max(0, shield+v); };
        this.stun = () => stun;
        this.addStun = (v) => { stun = Math.max(0, stun+v); };

        this.id = () => id;
        this.mark = () => mark;
        this.suitString = () => suitString;
        this.isPrismatic = () => (mark >= PrimitiveSuits.length);
    }

    constructor(opt){
        super();
        this.init(opt);
    }

    payCost(cost){
        if(this.SG() < cost) return false;
        this.addSG(-cost, 5);
        return true;
    }
}

/**
 * 敵のステータスを保持するクラス.
 * HP, MP, nameに加えて, 以下のステータスを持つ.
 * - antiskill
 *
 * @class
 */
class Enemy extends BasicStatus{
    init(opt, playerSS = null){
        let HP = opt.HP;
        let MP = opt.MP;

        const antiskill = opt.antiskill || [];
        this.antiskillContains = (cardID) => antiskill.includes(cardID);

        // 相性の処理
        if(playerSS && opt.affinity[playerSS]){
            const aff = opt.affinity[playerSS];
            HP = Math.floor(HP * 5 / (5+aff));
            MP = Math.floor(MP * (5 - aff) / 5);
        }

        super.init(HP, MP, opt.name);
    }

    constructor(opt, playerSS = null){
        super();
        this.init(opt, playerSS);
    }
}
