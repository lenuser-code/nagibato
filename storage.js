/**
 * @file
 * localStorageの読み書きを行うオブジェクトを実装する.
 *
 * @author lenuser
 */

/**
 * localStorageの読み書きを行うオブジェクト.
 * 読み書きした情報の保持も行う. そのため, プログラムがlocalStorageを
 * 使用しているか否かは, このオブジェクトのisUsed()メソッドで判別できる.
 * @type {Object}
 * @prop {Array<string|number|boolean>|null} config - 設定情報のうちlocalStorageに保存するものの配列.
 * 現在のバージョンでは,
 * 1. メインカードのID (string)
 * 2, コンボ成立ルールのバージョン (number)
 * 3. スキル持ちカードのマーカー設定 (boolean)
 *
 * がこの順番に格納されている. ロードする前, および, localStorageを利用しない設定のときはnull
 * @prop {string[]|null} deckInfo - デッキに含まれる各カードのIDを並べた配列.
 * ロードする前, および, localStorageを利用しない設定のときはnull
 * @namespace
 */
const LocalStorageInfo = {
config: null,
deckInfo: null,

/**
 * localStorageにゲームデータが保存されていれば, それをロードする.
 * ロードされたデータはconfigとdeckInfoに格納される.
 * もしゲームデータが保存されていない場合は何もしない.
 * ゲームデータが保存されているがパースに失敗した場合, configとdeckInfoに
 * nullを代入してから例外を投げる.
 * @throws {Error} localStorageの情報が正常にパースできなかったとき
 */
init: function(){
    const configJSON = localStorage.getItem("nagibato_config_data");
    const deckJSON = localStorage.getItem("nagibato_deck_data");
    if(configJSON){
        let targetInfo = "nagibato_config_data";
        try{
            this.config = JSON.parse(configJSON);
            if(deckJSON){
                targetInfo = "nagibato_deck_data";
                const IDs = JSON.parse(deckJSON);
                this.deckInfo = IDs;
            }
        } catch(e) {
            const err = new Error(`localStorageの情報が正常にパースできません： ${targetInfo}`);
            this.config = null;
            this.deckInfo = null;
            throw err;
        }
    }
},

/**
 * localStorageからデータがロードされていればtrue, そうでなければfalse.
 * init()を実行した後ならば, 「localStorageを使用する設定のときtrue,
 * そうでないときfalse」と読み替えることができる.
 * @returns {boolean} ロードされていればtrue, そうでなければfalse
 */
isUsed: function(){
    return (this.config !== null);
},

/**
 * 確認ダイアログを表示してユーザーに意思を確認したあと,
 * localStorageに保存されているゲームデータを消去する.
 * ただし, alreadyConfirmedが真のときは, 確認を飛ばして最初から消去する.
 * 消去を実行した場合, configとdeckInfoにnullを代入する.
 * @param {boolean} alreadyConfirmed - 既に確認済みならばtrue, そうでなければfalseを指定する
 */
removeStorage(alreadyConfirmed){
    if(alreadyConfirmed || window.confirm("localStorageを無効にするとき、保存されているデータを削除します。データを削除してよろしいですか？")){
        localStorage.removeItem("nagibato_config_data");
        localStorage.removeItem("nagibato_deck_data");
        this.config = null;
        this.deckInfo = null;
        return true;
    }
    return false;
},

/**
 * 設定情報のうちlocalStorageに保存する対象になっているものを
 * localStorageに保存する. 現在のバージョンでは
 * 1. メインカードのID (string)
 * 2, コンボ成立ルールのバージョン (number)
 * 3. スキル持ちカードのマーカー設定 (boolean)
 *
 * が保存の対象である.
 * @param {string} mainCardID - メインカードのID
 * @param {number} chainRuleVersion - コンボ成立ルールのバージョン
 * @param {boolean} skillMarkerFlag - スキル持ちカードのマーカー設定
 */
saveConfig: function(mainCardID, chainRuleVersion, skillMarkerFlag){
    const data = [mainCardID, chainRuleVersion, skillMarkerFlag];
    const json = JSON.stringify(data);
    localStorage.setItem("nagibato_config_data", json);
    this.config = data;
},

/**
 * デッキに登録されている各カードのIDを配列にまとめて保存する.
 * もしCardAtlasに登録されていないカードが含まれる場合, 例外を投げる.
 * @param {Card[]} usedCards - デッキに登録されているカードのリスト
 * @throws {Error} CardAtlasに登録されていないカードが含まれていたとき
 */
saveDeck: function(usedCards){
    const IDs = usedCards.map((card) => card.cardAtlasID);
    if(!IDs.every((e) => CardAtlas.get(e))){
        throw new Error("saveDeck: CardAtlasに属さないオブジェクトがデッキの中に含まれています");
    }

    const json = JSON.stringify(IDs);
    localStorage.setItem("nagibato_deck_data", json);
    this.deckInfo = IDs;
}
};
