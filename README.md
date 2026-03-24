# nagibato
a tiny simulator of "MAGICARD BATTLE"

## 概略
昔アーケードで稼働していた『MAGICARD BATTLE』（[https://madoka-magica-mg.sega.jp/](https://madoka-magica-mg.sega.jp/)）というカードゲームのシミュレータです. どちらかというと, MAGICARD BATTLEのルールや仕様に関する「動く記録資料」を作ることを目的としています.

## ファイル構造
* nagibato.html - ゲームを実行するHTMLファイル
* stdgam.js - いわゆるゲームエンジン部分
* stdtask.js - 頻出するタスクは抽出してここに置くつもり
* card.js - カードに関連するオブジェクトの実装
* enemy.js - 敵スキルの実装、および敵ステータスの管理
* model.js - プレイヤーおよび敵を表すクラスを実装
* QB.js - システムメッセージ、およびチュートリアルに関する実装
* edit.js - デッキ編集画面
* config.js - 設定画面
* battle.js - バトル画面
* storage.js - localStorageに関する機能の実装

## Acknowledgement
This simulator uses ZzFX (https://github.com/KilledByAPixel/ZzFX). I would like to express my gratitude to the ZzFX project and its community.
