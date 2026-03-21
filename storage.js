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
 */
const LocalStorageInfo = {
config: null,
deckInfo: null,

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

isUsed: function(){
    return (this.config !== null);
},

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

saveConfig: function(mainCardID, chainRuleVersion, skillMarkerFlag){
    const data = [mainCardID, chainRuleVersion, skillMarkerFlag];
    const json = JSON.stringify(data);
    localStorage.setItem("nagibato_config_data", json);
    this.config = data;
},

saveDeck: function(deck){
    const IDs = deck.map((card) => card.cardAtlasID);
    if(!IDs.every((e) => CardAtlas.get(e))){
        throw new Error("saveDeck: CardAtlasに属さないオブジェクトがdeckの中に含まれています");
    }

    const json = JSON.stringify(IDs);
    localStorage.setItem("nagibato_deck_data", json);
    this.deckInfo = IDs;
}
};
