const RAW_CARD_DATA = [
  {
    "id": "1-001",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 10,
    "MP": 950,
    "HP": 10500,
    "cost": 5
  },
  {
    "id": "1-002",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 10,
    "MP": 1000,
    "HP": 10000,
    "cost": 5
  },
  {
    "id": "1-003",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 10,
    "MP": 900,
    "HP": 11000,
    "cost": 5
  },
  {
    "id": "1-004",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 15,
    "MP": 1300,
    "HP": 17000,
    "cost": 7
  },
  {
    "id": "1-005",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 15,
    "MP": 1800,
    "HP": 12000,
    "cost": 7
  },
  {
    "id": "1-006",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 20,
    "MP": 1500,
    "HP": 21000,
    "cost": 8,
    "main": {
      "name": "浄化の光",
      "desc": "HPとソウルジェムを50％回復",
      "nagibato_code": [
        "addHPSG",
        50,
        "浄化の光"
      ]
    },
    "sub": {
      "name": "私は魔法少女だから",
      "desc": "このターンのチャージMPを30％アップ",
      "nagibato_code": [
        "chargeUp",
        30,
        "私は魔法少女だから"
      ]
    }
  },
  {
    "id": "1-007",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 30,
    "MP": 2500,
    "HP": 20000,
    "cost": 10,
    "main": {
      "name": "円環の理",
      "desc": "MPの3倍ダメージ",
      "nagibato_code": [
        "attack",
        300,
        "円環の理",
        "MPの3倍ダメージ"
      ]
    },
    "sub": {
      "name": "これからはずっと一緒だよ",
      "desc": "敵の攻撃を1回防御",
      "nagibato_code": [
        "addShield",
        1,
        "これからはずっと一緒だよ"
      ]
    }
  },
  {
    "id": "1-008",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 10,
    "MP": 900,
    "HP": 11000,
    "cost": 5
  },
  {
    "id": "1-009",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 10,
    "MP": 1100,
    "HP": 9000,
    "cost": 5
  },
  {
    "id": "1-010",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 10,
    "MP": 1000,
    "HP": 10000,
    "cost": 5
  },
  {
    "id": "1-011",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 15,
    "MP": 1650,
    "HP": 13500,
    "cost": 7
  },
  {
    "id": "1-012",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 15,
    "MP": 1900,
    "HP": 11000,
    "cost": 7
  },
  {
    "id": "1-013",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 20,
    "MP": 2000,
    "HP": 16000,
    "cost": 8,
    "main": {
      "name": "時間操作",
      "desc": "MP×1のダメージを2回与える",
      "nagibato_code": [
        "multiAttack",
        [
          100,
          2
        ],
        "時間操作",
        "MP×1のダメージを2回与える"
      ]
    },
    "sub": {
      "name": "私は何度でも繰り返す",
      "desc": "敵の攻撃を1回防御",
      "nagibato_code": [
        "addShield",
        1,
        "私は何度でも繰り返す"
      ]
    }
  },
  {
    "id": "1-014",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 25,
    "MP": 1800,
    "HP": 22000,
    "cost": 9,
    "main": {
      "name": "束ねた螺旋",
      "desc": "HPとソウルジェムを回復しターン数回復",
      "nagibato_code": [
        "timeWarp",
        0,
        "束ねた螺旋"
      ]
    },
    "sub": {
      "name": "私一人で片付ける",
      "desc": "このターンのチャージMPを50％アップ",
      "nagibato_code": [
        "chargeUp",
        50,
        "私一人で片付ける"
      ]
    }
  },
  {
    "id": "1-015",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 10,
    "MP": 1150,
    "HP": 8500,
    "cost": 5
  },
  {
    "id": "1-016",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 10,
    "MP": 800,
    "HP": 12000,
    "cost": 5
  },
  {
    "id": "1-017",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 10,
    "MP": 1000,
    "HP": 10000,
    "cost": 5
  },
  {
    "id": "1-018",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 10,
    "MP": 1100,
    "HP": 9000,
    "cost": 5
  },
  {
    "id": "1-019",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 15,
    "MP": 1650,
    "HP": 13500,
    "cost": 7
  },
  {
    "id": "1-020",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 20,
    "MP": 1800,
    "HP": 18000,
    "cost": 8,
    "main": {
      "name": "超回復",
      "desc": "HPを100％回復",
      "nagibato_code": [
        "addHP",
        100,
        "超回復"
      ]
    },
    "sub": {
      "name": "負ける気がしないわ",
      "desc": "ターンの開始時にHPが10％回復",
      "nagibato_code": [
        "heal",
        10,
        "負ける気がしないわ"
      ]
    }
  },
  {
    "id": "1-021",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 25,
    "MP": 1500,
    "HP": 25000,
    "cost": 9,
    "main": {
      "name": "魂と器",
      "desc": "敵の攻撃を2回防御",
      "nagibato_code": [
        "addShield",
        2,
        "魂と器"
      ]
    },
    "sub": {
      "name": "奇跡も魔法もあるんだよ",
      "desc": "ターンの開始時にHPが20％回復",
      "nagibato_code": [
        "heal",
        20,
        "奇跡も魔法もあるんだよ"
      ]
    }
  },
  {
    "id": "1-022",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 10,
    "MP": 1000,
    "HP": 10000,
    "cost": 5
  },
  {
    "id": "1-023",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 10,
    "MP": 950,
    "HP": 10500,
    "cost": 5
  },
  {
    "id": "1-024",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 10,
    "MP": 1150,
    "HP": 8500,
    "cost": 5
  },
  {
    "id": "1-025",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 10,
    "MP": 1050,
    "HP": 9500,
    "cost": 5
  },
  {
    "id": "1-026",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 15,
    "MP": 1300,
    "HP": 17000,
    "cost": 7
  },
  {
    "id": "1-027",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 20,
    "MP": 1800,
    "HP": 18000,
    "cost": 8,
    "main": {
      "name": "拘束リボン",
      "desc": "敵の攻撃を2回防御",
      "nagibato_code": [
        "addShield",
        2,
        "拘束リボン"
      ]
    },
    "sub": {
      "name": "ちゃんと解放してあげる",
      "desc": "敵の攻撃を1回防御",
      "nagibato_code": [
        "addShield",
        1,
        "ちゃんと解放してあげる"
      ]
    }
  },
  {
    "id": "1-028",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 25,
    "MP": 2200,
    "HP": 18000,
    "cost": 9,
    "main": {
      "name": "ティロ・フィナーレ",
      "desc": "MPの2倍ダメージ",
      "nagibato_code": [
        "attack",
        200,
        "ティロ・フィナーレ",
        "MPの2倍ダメージ"
      ]
    },
    "sub": {
      "name": "ティロ・フィナーレ",
      "desc": "このターンのチャージMPを50％アップ",
      "nagibato_code": [
        "chargeUp",
        50,
        "ティロ・フィナーレ"
      ]
    }
  },
  {
    "id": "1-029",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 10,
    "MP": 900,
    "HP": 11000,
    "cost": 5
  },
  {
    "id": "1-030",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 10,
    "MP": 1050,
    "HP": 9500,
    "cost": 5
  },
  {
    "id": "1-031",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 10,
    "MP": 1100,
    "HP": 9000,
    "cost": 5
  },
  {
    "id": "1-032",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 10,
    "MP": 950,
    "HP": 10500,
    "cost": 5
  },
  {
    "id": "1-033",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 15,
    "MP": 1800,
    "HP": 12000,
    "cost": 7
  },
  {
    "id": "1-034",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 20,
    "MP": 1700,
    "HP": 19000,
    "cost": 8,
    "main": {
      "name": "栄養補給",
      "desc": "HPを100％回復",
      "nagibato_code": [
        "addHP",
        100,
        "栄養補給"
      ]
    },
    "sub": {
      "name": "食うかい？",
      "desc": "HPを30％回復",
      "nagibato_code": [
        "addHP",
        30,
        "食うかい？"
      ]
    }
  },
  {
    "id": "1-035",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 25,
    "MP": 2300,
    "HP": 17000,
    "cost": 9,
    "main": {
      "name": "槍の一閃",
      "desc": "MPの2倍ダメージ",
      "nagibato_code": [
        "attack",
        200,
        "槍の一閃",
        "MPの2倍ダメージ"
      ]
    },
    "sub": {
      "name": "そんなのあたしが許さない",
      "desc": "このターンのチャージMPを50％アップ",
      "nagibato_code": [
        "chargeUp",
        50,
        "そんなのあたしが許さない"
      ]
    }
  },
  {
    "id": "1-036",
    "character": "まどか＆ほむら",
    "suit_string": "MdHm",
    "Lv": 15,
    "MP": 1300,
    "HP": 17000,
    "cost": 7
  },
  {
    "id": "1-037",
    "character": "まどか＆ほむら",
    "suit_string": "MdHm",
    "Lv": 15,
    "MP": 1500,
    "HP": 15000,
    "cost": 7
  },
  {
    "id": "1-038",
    "character": "まどか＆ほむら",
    "suit_string": "MdHm",
    "Lv": 15,
    "MP": 1600,
    "HP": 14000,
    "cost": 7
  },
  {
    "id": "1-039",
    "character": "まどか＆ほむら",
    "suit_string": "MdHm",
    "Lv": 15,
    "MP": 1400,
    "HP": 16000,
    "cost": 7
  },
  {
    "id": "1-040",
    "character": "まどか＆ほむら",
    "suit_string": "MdHm",
    "Lv": 15,
    "MP": 1650,
    "HP": 13500,
    "cost": 7
  },
  {
    "id": "1-041",
    "character": "まどか＆ほむら",
    "suit_string": "MdHm",
    "Lv": 20,
    "MP": 1800,
    "HP": 18000,
    "cost": 8,
    "sub": {
      "name": "がんばって！",
      "desc": "ピンク属性カードのMPが10％アップ",
      "nagibato_code": [
        "suitSpecificBoost",
        [
          "ピンク属性",
          "Md",
          10
        ],
        "がんばって！"
      ]
    }
  },
  {
    "id": "1-042",
    "character": "魔法少女",
    "suit_string": "Quintet",
    "Lv": 10,
    "MP": 900,
    "HP": 11000,
    "cost": 5
  },
  {
    "id": "1-043",
    "character": "魔法少女",
    "suit_string": "Quintet",
    "Lv": 10,
    "MP": 1150,
    "HP": 8500,
    "cost": 5
  },
  {
    "id": "1-044",
    "character": "魔法少女",
    "suit_string": "Quintet",
    "Lv": 10,
    "MP": 1000,
    "HP": 10000,
    "cost": 5
  },
  {
    "id": "1-045",
    "character": "魔法少女",
    "suit_string": "Quintet",
    "Lv": 20,
    "MP": 1800,
    "HP": 18000,
    "cost": 8,
    "sub": {
      "name": "５人の魔法少女",
      "desc": "残りHP50％以下でメインMP10％上昇",
      "nagibato_code": [
        "crisisBoost",
        10,
        "５人の魔法少女"
      ]
    }
  },
  {
    "id": "1-046",
    "character": "魔法少女",
    "suit_string": "Quintet",
    "Lv": 20,
    "MP": 1600,
    "HP": 20000,
    "cost": 8,
    "sub": {
      "name": "夏祭り！",
      "desc": "メインカードMPが10％アップ",
      "nagibato_code": [
        "addMP",
        10,
        "夏祭り！"
      ]
    }
  },
  {
    "id": "1-047",
    "character": "まどか＆さやか＆マミ＆ほむら",
    "suit_string": "MdSyMmHm",
    "Lv": 15,
    "MP": 1500,
    "HP": 15000,
    "cost": 7
  },
  {
    "id": "1-048",
    "character": "まどか＆さやか＆マミ＆ほむら",
    "suit_string": "MdSyMmHm",
    "Lv": 15,
    "MP": 1500,
    "HP": 15000,
    "cost": 7
  },
  {
    "id": "1-049",
    "character": "まどか＆さやか＆マミ＆ほむら",
    "suit_string": "MdSyMmHm",
    "Lv": 20,
    "MP": 1700,
    "HP": 19000,
    "cost": 8,
    "sub": {
      "name": "ある日の休息",
      "desc": "残りHP50％以下でメインMP10％上昇",
      "nagibato_code": [
        "crisisBoost",
        10,
        "ある日の休息"
      ]
    }
  },
  {
    "id": "1-050",
    "character": "まどか＆さやか＆ほむら＆杏子",
    "suit_string": "MdSyHmKy",
    "Lv": 20,
    "MP": 2000,
    "HP": 16000,
    "cost": 8,
    "sub": {
      "name": "幸せな時間",
      "desc": "メインカードMPが10％アップ",
      "nagibato_code": [
        "addMP",
        10,
        "幸せな時間"
      ]
    }
  },
  {
    "id": "1-051",
    "character": "まどか＆さやか",
    "suit_string": "MdSy",
    "Lv": 10,
    "MP": 950,
    "HP": 10500,
    "cost": 5
  },
  {
    "id": "1-052",
    "character": "まどか＆さやか",
    "suit_string": "MdSy",
    "Lv": 15,
    "MP": 1500,
    "HP": 15000,
    "cost": 7
  },
  {
    "id": "1-053",
    "character": "まどか＆マミ",
    "suit_string": "MdMm",
    "Lv": 15,
    "MP": 1650,
    "HP": 13500,
    "cost": 7
  },
  {
    "id": "1-054",
    "character": "杏子＆さやか",
    "suit_string": "KySy",
    "Lv": 10,
    "MP": 1000,
    "HP": 10000,
    "cost": 5
  },
  {
    "id": "1-055",
    "character": "杏子＆さやか",
    "suit_string": "KySy",
    "Lv": 15,
    "MP": 1500,
    "HP": 15000,
    "cost": 7
  },
  {
    "id": "1-056",
    "character": "杏子＆さやか",
    "suit_string": "KySy",
    "Lv": 20,
    "MP": 1650,
    "HP": 19500,
    "cost": 8,
    "sub": {
      "name": "友達になれた！",
      "desc": "このターンのチャージMPを30％アップ",
      "nagibato_code": [
        "chargeUp",
        30,
        "友達になれた！"
      ]
    }
  },
  {
    "id": "1-057",
    "character": "杏子＆まどか",
    "suit_string": "KyMd",
    "Lv": 10,
    "MP": 1000,
    "HP": 10000,
    "cost": 5
  },
  {
    "id": "1-058",
    "character": "ベベ",
    "suit_string": "Bb",
    "Lv": 10,
    "MP": 1000,
    "HP": 10000,
    "cost": 5
  },
  {
    "id": "1-059",
    "character": "百江なぎさ",
    "suit_string": "Ng",
    "Lv": 15,
    "MP": 1400,
    "HP": 16000,
    "cost": 7
  },
  {
    "id": "1-060",
    "character": "叛逆の物語",
    "suit_string": "Re",
    "Lv": 20,
    "MP": 1800,
    "HP": 18000,
    "cost": 8,
    "sub": {
      "name": "叛逆の物語",
      "desc": "ターンの開始時にソウルジェムが20％回復",
      "nagibato_code": [
        "SGHeal",
        20,
        "叛逆の物語"
      ]
    }
  },
  {
    "id": "2-001",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 10,
    "MP": 900,
    "HP": 11000,
    "cost": 5
  },
  {
    "id": "2-002",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 10,
    "MP": 1050,
    "HP": 9500,
    "cost": 5
  },
  {
    "id": "2-003",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 10,
    "MP": 950,
    "HP": 10500,
    "cost": 5
  },
  {
    "id": "2-004",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 15,
    "MP": 1350,
    "HP": 16500,
    "cost": 7
  },
  {
    "id": "2-005",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 15,
    "MP": 1700,
    "HP": 13000,
    "cost": 7
  },
  {
    "id": "2-006",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 20,
    "MP": 2000,
    "HP": 16000,
    "cost": 8,
    "main": {
      "name": "まどかの願い",
      "desc": "HPを100％回復",
      "nagibato_code": [
        "addHP",
        100,
        "まどかの願い"
      ]
    },
    "sub": {
      "name": "クラスのみんなには内緒だよ",
      "desc": "このターンのチャージMPを20％アップ",
      "nagibato_code": [
        "chargeUp",
        20,
        "クラスのみんなには内緒だよ"
      ]
    }
  },
  {
    "id": "2-007",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 25,
    "MP": 1900,
    "HP": 21000,
    "cost": 9,
    "main": {
      "name": "希望と絶望",
      "desc": "ピンク属性カードのMPが50％アップ",
      "nagibato_code": [
        "suitSpecificBoost",
        [
          "ピンク属性",
          "Md",
          50
        ],
        "希望と絶望"
      ]
    },
    "sub": {
      "name": "私魔法少女になる",
      "desc": "ターンの開始時にHPが20％回復",
      "nagibato_code": [
        "heal",
        20,
        "私魔法少女になる"
      ]
    }
  },
  {
    "id": "2-008",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 30,
    "MP": 2300,
    "HP": 22000,
    "cost": 10,
    "main": {
      "name": "救いの導き手",
      "desc": "MPの3倍ダメージ",
      "nagibato_code": [
        "attack",
        300,
        "救いの導き手",
        "MPの3倍ダメージ"
      ]
    },
    "sub": {
      "name": "もう絶望する必要なんてない",
      "desc": "ピンク属性カードのMPが30％アップ",
      "nagibato_code": [
        "suitSpecificBoost",
        [
          "ピンク属性",
          "Md",
          30
        ],
        "もう絶望する必要なんてない"
      ]
    }
  },
  {
    "id": "2-009",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 10,
    "MP": 850,
    "HP": 11500,
    "cost": 5
  },
  {
    "id": "2-010",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 10,
    "MP": 1150,
    "HP": 8500,
    "cost": 5
  },
  {
    "id": "2-011",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 10,
    "MP": 1100,
    "HP": 9000,
    "cost": 5
  },
  {
    "id": "2-012",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 15,
    "MP": 1500,
    "HP": 15000,
    "cost": 7
  },
  {
    "id": "2-013",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 15,
    "MP": 1350,
    "HP": 16500,
    "cost": 7
  },
  {
    "id": "2-014",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 20,
    "MP": 1700,
    "HP": 19000,
    "cost": 8,
    "main": {
      "name": "あの子の思い出",
      "desc": "HPを80％回復",
      "nagibato_code": [
        "addHP",
        80,
        "あの子の思い出"
      ]
    },
    "sub": {
      "name": "絶対にあなたを救ってみせる",
      "desc": "敵の攻撃を1回防御",
      "nagibato_code": [
        "addShield",
        1,
        "絶対にあなたを救ってみせる"
      ]
    }
  },
  {
    "id": "2-015",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 25,
    "MP": 2000,
    "HP": 20000,
    "cost": 9,
    "main": {
      "name": "重ねた時間",
      "desc": "制限時間を2秒延長",
      "nagibato_code": [
        "extendTime",
        2,
        "重ねた時間"
      ]
    },
    "sub": {
      "name": "だから私は戦い続ける",
      "desc": "メインカードMPが20％アップ",
      "nagibato_code": [
        "addMP",
        20,
        "だから私は戦い続ける"
      ]
    }
  },
  {
    "id": "2-016",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 30,
    "MP": 2800,
    "HP": 17000,
    "cost": 10,
    "main": {
      "name": "悪魔の微笑み",
      "desc": "相手のMPを50％減少",
      "nagibato_code": [
        "reduceEnemyMP",
        50,
        "悪魔の微笑み"
      ]
    },
    "sub": {
      "name": "協力してもらうわよ",
      "desc": "ターンの開始時にソウルジェムが100％回復",
      "nagibato_code": [
        "SGHeal",
        100,
        "協力してもらうわよ"
      ]
    }
  },
  {
    "id": "2-017",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 10,
    "MP": 1000,
    "HP": 10000,
    "cost": 5
  },
  {
    "id": "2-018",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 10,
    "MP": 1200,
    "HP": 8000,
    "cost": 5
  },
  {
    "id": "2-019",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 10,
    "MP": 950,
    "HP": 10500,
    "cost": 5
  },
  {
    "id": "2-020",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 10,
    "MP": 900,
    "HP": 11000,
    "cost": 5
  },
  {
    "id": "2-021",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 15,
    "MP": 1300,
    "HP": 17000,
    "cost": 7
  },
  {
    "id": "2-022",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 20,
    "MP": 1900,
    "HP": 17000,
    "cost": 8,
    "main": {
      "name": "決意の力",
      "desc": "MPの150％ダメージ",
      "nagibato_code": [
        "attack",
        150,
        "決意の力"
      ]
    },
    "sub": {
      "name": "正義の味方の努めだからね",
      "desc": "このターンのチャージMPを20％アップ",
      "nagibato_code": [
        "chargeUp",
        20,
        "正義の味方の努めだからね"
      ]
    }
  },
  {
    "id": "2-023",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 25,
    "MP": 2100,
    "HP": 19000,
    "cost": 9,
    "main": {
      "name": "水の癒し",
      "desc": "HPを100％回復",
      "nagibato_code": [
        "addHP",
        100,
        "水の癒し"
      ]
    },
    "sub": {
      "name": "サンキュ！",
      "desc": "ターンの開始時にHPが20％回復",
      "nagibato_code": [
        "heal",
        20,
        "サンキュ！"
      ]
    }
  },
  {
    "id": "2-024",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 10,
    "MP": 900,
    "HP": 11000,
    "cost": 5
  },
  {
    "id": "2-025",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 10,
    "MP": 1100,
    "HP": 9000,
    "cost": 5
  },
  {
    "id": "2-026",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 10,
    "MP": 1000,
    "HP": 10000,
    "cost": 5
  },
  {
    "id": "2-027",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 10,
    "MP": 1150,
    "HP": 8500,
    "cost": 5
  },
  {
    "id": "2-028",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 15,
    "MP": 1750,
    "HP": 12500,
    "cost": 7
  },
  {
    "id": "2-029",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 20,
    "MP": 1600,
    "HP": 20000,
    "cost": 8,
    "main": {
      "name": "孤独な英雄",
      "desc": "MP×1のダメージを2回与える",
      "nagibato_code": [
        "multiAttack",
        [
          100,
          2
        ],
        "孤独な英雄",
        "MP×1のダメージを2回与える"
      ]
    },
    "sub": {
      "name": "負けるもんですか",
      "desc": "このターンのチャージMPを20％アップ",
      "nagibato_code": [
        "chargeUp",
        20,
        "負けるもんですか"
      ]
    }
  },
  {
    "id": "2-030",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 25,
    "MP": 2000,
    "HP": 20000,
    "cost": 9,
    "main": {
      "name": "仲間の為に",
      "desc": "敵の攻撃を2回防御",
      "nagibato_code": [
        "addShield",
        2,
        "仲間の為に"
      ]
    },
    "sub": {
      "name": "もう何も恐くない",
      "desc": "相手のMPを20％減少",
      "nagibato_code": [
        "reduceEnemyMP",
        20,
        "もう何も恐くない"
      ]
    }
  },
  {
    "id": "2-031",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 10,
    "MP": 950,
    "HP": 10500,
    "cost": 5
  },
  {
    "id": "2-032",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 10,
    "MP": 1150,
    "HP": 8500,
    "cost": 5
  },
  {
    "id": "2-033",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 10,
    "MP": 1000,
    "HP": 10000,
    "cost": 5
  },
  {
    "id": "2-034",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 10,
    "MP": 900,
    "HP": 11000,
    "cost": 5
  },
  {
    "id": "2-035",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 15,
    "MP": 1700,
    "HP": 13000,
    "cost": 7
  },
  {
    "id": "2-036",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 20,
    "MP": 1900,
    "HP": 17000,
    "cost": 8,
    "main": {
      "name": "願った奇跡",
      "desc": "メインカードMPが50％アップ",
      "nagibato_code": [
        "addMP",
        50,
        "願った奇跡"
      ]
    },
    "sub": {
      "name": "あたしが引き受ける",
      "desc": "このターンのチャージMPを20％アップ",
      "nagibato_code": [
        "chargeUp",
        20,
        "あたしが引き受ける"
      ]
    }
  },
  {
    "id": "2-037",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 25,
    "MP": 2100,
    "HP": 19000,
    "cost": 9,
    "main": {
      "name": "新たな誓い",
      "desc": "MPの2倍ダメージ",
      "nagibato_code": [
        "attack",
        200,
        "新たな誓い",
        "MPの2倍ダメージ"
      ]
    },
    "sub": {
      "name": "一緒にいてやるよ",
      "desc": "HPを50％回復",
      "nagibato_code": [
        "addHP",
        50,
        "一緒にいてやるよ"
      ]
    }
  },
  {
    "id": "2-038",
    "character": "百江なぎさ",
    "suit_string": "Ng",
    "Lv": 10,
    "MP": 950,
    "HP": 10500,
    "cost": 5
  },
  {
    "id": "2-039",
    "character": "百江なぎさ",
    "suit_string": "Ng",
    "Lv": 10,
    "MP": 1000,
    "HP": 10000,
    "cost": 5
  },
  {
    "id": "2-040",
    "character": "百江なぎさ",
    "suit_string": "Ng",
    "Lv": 15,
    "MP": 1600,
    "HP": 14000,
    "cost": 7
  },
  {
    "id": "2-041",
    "character": "まどか＆ほむら",
    "suit_string": "MdHm",
    "Lv": 15,
    "MP": 1400,
    "HP": 16000,
    "cost": 7
  },
  {
    "id": "2-042",
    "character": "まどか＆ほむら",
    "suit_string": "MdHm",
    "Lv": 15,
    "MP": 1450,
    "HP": 15500,
    "cost": 7
  },
  {
    "id": "2-043",
    "character": "まどか＆マミ",
    "suit_string": "MdMm",
    "Lv": 15,
    "MP": 1650,
    "HP": 13500,
    "cost": 7
  },
  {
    "id": "2-044",
    "character": "まどか＆さやか＆杏子",
    "suit_string": "MdSyKy",
    "Lv": 15,
    "MP": 1500,
    "HP": 15000,
    "cost": 7
  },
  {
    "id": "2-045",
    "character": "杏子＆ほむら",
    "suit_string": "KyHm",
    "Lv": 15,
    "MP": 1400,
    "HP": 16000,
    "cost": 7
  },
  {
    "id": "2-046",
    "character": "杏子＆さやか",
    "suit_string": "KySy",
    "Lv": 15,
    "MP": 1350,
    "HP": 16500,
    "cost": 7
  },
  {
    "id": "2-047",
    "character": "まどか＆マミ",
    "suit_string": "MdMm",
    "Lv": 15,
    "MP": 1700,
    "HP": 13000,
    "cost": 7
  },
  {
    "id": "2-048",
    "character": "杏子＆さやか",
    "suit_string": "KySy",
    "Lv": 15,
    "MP": 1650,
    "HP": 13500,
    "cost": 7
  },
  {
    "id": "2-049",
    "character": "まどか＆ほむら",
    "suit_string": "MdHm",
    "Lv": 15,
    "MP": 1550,
    "HP": 14500,
    "cost": 7
  },
  {
    "id": "2-050",
    "character": "まどか＆さやか＆杏子",
    "suit_string": "MdSyKy",
    "Lv": 15,
    "MP": 1500,
    "HP": 15000,
    "cost": 7
  },
  {
    "id": "2-051",
    "character": "まどか＆ほむら",
    "suit_string": "MdHm",
    "Lv": 20,
    "MP": 1900,
    "HP": 17000,
    "cost": 8,
    "sub": {
      "name": "最高の友達",
      "desc": "紫属性カードのMPが10％アップ",
      "nagibato_code": [
        "suitSpecificBoost",
        [
          "紫属性",
          "Hm",
          10
        ],
        "最高の友達"
      ]
    }
  },
  {
    "id": "2-052",
    "character": "杏子＆ほむら",
    "suit_string": "KyHm",
    "Lv": 20,
    "MP": 1800,
    "HP": 18000,
    "cost": 8,
    "sub": {
      "name": "晩飯おごってよ",
      "desc": "HPを20％回復",
      "nagibato_code": [
        "addHP",
        20,
        "晩飯おごってよ"
      ]
    }
  },
  {
    "id": "2-053",
    "character": "マミ＆なぎさ",
    "suit_string": "MmNg",
    "Lv": 20,
    "MP": 1700,
    "HP": 19000,
    "cost": 8,
    "sub": {
      "name": "昔からの友達だもの",
      "desc": "黄色属性カードのMPが10％アップ",
      "nagibato_code": [
        "suitSpecificBoost",
        [
          "黄色属性",
          "Mm",
          10
        ],
        "昔からの友達だもの"
      ]
    }
  },
  {
    "id": "2-054",
    "character": "魔法少女",
    "suit_string": "Quintet",
    "Lv": 30,
    "MP": 2500,
    "HP": 20000,
    "cost": 10,
    "sub": {
      "name": "お正月気分",
      "desc": "ターンの開始時にソウルジェムが20％回復",
      "nagibato_code": [
        "SGHeal",
        20,
        "お正月気分"
      ]
    }
  },
  {
    "id": "3-001",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 10,
    "MP": 950,
    "HP": 10500,
    "cost": 5
  },
  {
    "id": "3-002",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 10,
    "MP": 1100,
    "HP": 9000,
    "cost": 5
  },
  {
    "id": "3-003",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 10,
    "MP": 900,
    "HP": 11000,
    "cost": 5
  },
  {
    "id": "3-004",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 15,
    "MP": 1600,
    "HP": 14000,
    "cost": 7
  },
  {
    "id": "3-005",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 15,
    "MP": 1300,
    "HP": 17000,
    "cost": 7
  },
  {
    "id": "3-006",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 20,
    "MP": 1600,
    "HP": 20000,
    "cost": 8,
    "main": {
      "name": "全ての希望",
      "desc": "MPの2倍ダメージ",
      "nagibato_code": [
        "attack",
        200,
        "全ての希望",
        "MPの2倍ダメージ"
      ]
    },
    "sub": {
      "name": "私が受け止めてあげるから",
      "desc": "敵の攻撃を1回防御",
      "nagibato_code": [
        "addShield",
        1,
        "私が受け止めてあげるから"
      ]
    }
  },
  {
    "id": "3-007",
    "character": "鹿目まどか",
    "suit_string": "Md",
    "Lv": 25,
    "MP": 2000,
    "HP": 20000,
    "cost": 9,
    "main": {
      "name": "まどかの夢",
      "desc": "HPとソウルジェムを100％回復",
      "nagibato_code": [
        "addHPSG",
        100,
        "まどかの夢"
      ]
    },
    "sub": {
      "name": "私、鹿目まどか",
      "desc": "各ターンの開始時にHPが最大値の20％回復",
      "nagibato_code": [
        "heal",
        20,
        "私、鹿目まどか"
      ]
    }
  },
  {
    "id": "3-008",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 10,
    "MP": 900,
    "HP": 11000,
    "cost": 5
  },
  {
    "id": "3-009",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 10,
    "MP": 1150,
    "HP": 8500,
    "cost": 5
  },
  {
    "id": "3-010",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 10,
    "MP": 950,
    "HP": 10500,
    "cost": 5
  },
  {
    "id": "3-011",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 15,
    "MP": 1500,
    "HP": 15000,
    "cost": 7
  },
  {
    "id": "3-012",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 15,
    "MP": 1800,
    "HP": 12000,
    "cost": 7
  },
  {
    "id": "3-013",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 20,
    "MP": 1900,
    "HP": 17000,
    "cost": 8,
    "main": {
      "name": "一つの願い",
      "desc": "MP×1のダメージを2回与える",
      "nagibato_code": [
        "multiAttack",
        [
          100,
          2
        ],
        "一つの願い",
        "MP×1のダメージを2回与える"
      ]
    },
    "sub": {
      "name": "安全は保証するわ",
      "desc": "このターンのチャージMPを50％アップ",
      "nagibato_code": [
        "chargeUp",
        50,
        "安全は保証するわ"
      ]
    }
  },
  {
    "id": "3-014",
    "character": "暁美ほむら",
    "suit_string": "Hm",
    "Lv": 25,
    "MP": 2000,
    "HP": 20000,
    "cost": 9,
    "main": {
      "name": "ほむらの決心",
      "desc": "敵の攻撃を2回防御",
      "nagibato_code": [
        "addShield",
        2,
        "ほむらの決心"
      ]
    },
    "sub": {
      "name": "あなたを私に守らせて",
      "desc": "敵の攻撃を1回防御",
      "nagibato_code": [
        "addShield",
        1,
        "あなたを私に守らせて"
      ]
    }
  },
  {
    "id": "3-015",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 10,
    "MP": 800,
    "HP": 12000,
    "cost": 5
  },
  {
    "id": "3-016",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 10,
    "MP": 950,
    "HP": 10500,
    "cost": 5
  },
  {
    "id": "3-017",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 10,
    "MP": 1100,
    "HP": 9000,
    "cost": 5
  },
  {
    "id": "3-018",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 10,
    "MP": 1050,
    "HP": 9500,
    "cost": 5
  },
  {
    "id": "3-019",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 15,
    "MP": 1400,
    "HP": 16000,
    "cost": 7
  },
  {
    "id": "3-020",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 20,
    "MP": 1650,
    "HP": 19500,
    "cost": 8,
    "main": {
      "name": "友人のために",
      "desc": "MPの2倍ダメージ",
      "nagibato_code": [
        "attack",
        200,
        "友人のために",
        "MPの2倍ダメージ"
      ]
    },
    "sub": {
      "name": "何でも訊いてくれたまえ",
      "desc": "このターンのチャージMPを30％アップ",
      "nagibato_code": [
        "chargeUp",
        30,
        "何でも訊いてくれたまえ"
      ]
    }
  },
  {
    "id": "3-021",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 25,
    "MP": 2000,
    "HP": 20000,
    "cost": 9,
    "main": {
      "name": "さやかの笑顔",
      "desc": "HPとソウルジェムを100％回復",
      "nagibato_code": [
        "addHPSG",
        100,
        "さやかの笑顔"
      ]
    },
    "sub": {
      "name": "舞い上がっちゃってますね！",
      "desc": "HPを50％回復",
      "nagibato_code": [
        "addHP",
        50,
        "舞い上がっちゃってますね！"
      ]
    }
  },
  {
    "id": "3-022",
    "character": "美樹さやか",
    "suit_string": "Sy",
    "Lv": 30,
    "MP": 2000,
    "HP": 25000,
    "cost": 10,
    "main": {
      "name": "希望の覚醒",
      "desc": "敵の攻撃を3回防御",
      "nagibato_code": [
        "addShield",
        3,
        "希望の覚醒"
      ]
    },
    "sub": {
      "name": "鞄持ちみたいなモンですわ",
      "desc": "敵の攻撃を2回防御",
      "nagibato_code": [
        "addShield",
        2,
        "鞄持ちみたいなモンですわ"
      ]
    }
  },
  {
    "id": "3-023",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 10,
    "MP": 1200,
    "HP": 8000,
    "cost": 5
  },
  {
    "id": "3-024",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 10,
    "MP": 900,
    "HP": 11000,
    "cost": 5
  },
  {
    "id": "3-025",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 10,
    "MP": 1050,
    "HP": 9500,
    "cost": 5
  },
  {
    "id": "3-026",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 10,
    "MP": 1150,
    "HP": 8500,
    "cost": 5
  },
  {
    "id": "3-027",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 15,
    "MP": 1700,
    "HP": 13000,
    "cost": 7
  },
  {
    "id": "3-028",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 20,
    "MP": 1600,
    "HP": 20000,
    "cost": 8,
    "main": {
      "name": "見守る力",
      "desc": "HPを100％回復",
      "nagibato_code": [
        "addHP",
        100,
        "見守る力"
      ]
    },
    "sub": {
      "name": "間一髪ってところね",
      "desc": "HPを50％回復",
      "nagibato_code": [
        "addHP",
        50,
        "間一髪ってところね"
      ]
    }
  },
  {
    "id": "3-029",
    "character": "巴マミ",
    "suit_string": "Mm",
    "Lv": 25,
    "MP": 2000,
    "HP": 20000,
    "cost": 9,
    "main": {
      "name": "マミの心配",
      "desc": "MPの2倍ダメージ",
      "nagibato_code": [
        "attack",
        200,
        "マミの心配",
        "MPの2倍ダメージ"
      ]
    },
    "sub": {
      "name": "みんな、うちに寄っていく？",
      "desc": "このターンのチャージMPを50％アップ",
      "nagibato_code": [
        "chargeUp",
        50,
        "みんな、うちに寄っていく？"
      ]
    }
  },
  {
    "id": "3-030",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 10,
    "MP": 1000,
    "HP": 10000,
    "cost": 5
  },
  {
    "id": "3-031",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 10,
    "MP": 1100,
    "HP": 9000,
    "cost": 5
  },
  {
    "id": "3-032",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 10,
    "MP": 950,
    "HP": 10500,
    "cost": 5
  },
  {
    "id": "3-033",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 10,
    "MP": 1050,
    "HP": 9500,
    "cost": 5
  },
  {
    "id": "3-034",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 15,
    "MP": 1650,
    "HP": 13500,
    "cost": 7
  },
  {
    "id": "3-035",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 20,
    "MP": 2000,
    "HP": 16000,
    "cost": 8,
    "main": {
      "name": "本当の気持ち",
      "desc": "HPを100％回復",
      "nagibato_code": [
        "addHP",
        100,
        "本当の気持ち"
      ]
    },
    "sub": {
      "name": "見てらんねーっつーの",
      "desc": "敵の攻撃を1回防御",
      "nagibato_code": [
        "addShield",
        1,
        "見てらんねーっつーの"
      ]
    }
  },
  {
    "id": "3-036",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 25,
    "MP": 2000,
    "HP": 20000,
    "cost": 9,
    "main": {
      "name": "杏子の真意",
      "desc": "敵の攻撃を2回防御",
      "nagibato_code": [
        "addShield",
        2,
        "杏子の真意"
      ]
    },
    "sub": {
      "name": "いいんじゃねえの",
      "desc": "HPを50％回復",
      "nagibato_code": [
        "addHP",
        50,
        "いいんじゃねえの"
      ]
    }
  },
  {
    "id": "3-037",
    "character": "佐倉杏子",
    "suit_string": "Ky",
    "Lv": 30,
    "MP": 2500,
    "HP": 20000,
    "cost": 10,
    "main": {
      "name": "絶望の救い手",
      "desc": "MPの3倍ダメージ",
      "nagibato_code": [
        "attack",
        300,
        "絶望の救い手",
        "MPの3倍ダメージ"
      ]
    },
    "sub": {
      "name": "アミコミケッカイ！！",
      "desc": "敵の攻撃を2回防御",
      "nagibato_code": [
        "addShield",
        2,
        "アミコミケッカイ！！"
      ]
    }
  },
  {
    "id": "3-038",
    "character": "百江なぎさ",
    "suit_string": "Ng",
    "Lv": 10,
    "MP": 950,
    "HP": 10500,
    "cost": 5
  },
  {
    "id": "3-039",
    "character": "百江なぎさ",
    "suit_string": "Ng",
    "Lv": 10,
    "MP": 1100,
    "HP": 9000,
    "cost": 5
  },
  {
    "id": "3-040",
    "character": "百江なぎさ",
    "suit_string": "Ng",
    "Lv": 20,
    "MP": 1700,
    "HP": 19000,
    "cost": 8,
    "main": {
      "name": "記憶の運び手",
      "desc": "HPとソウルジェムを100％回復",
      "nagibato_code": [
        "addHPSG",
        100,
        "記憶の運び手"
      ]
    },
    "sub": {
      "name": "黙っていてごめんなさい",
      "desc": "敵の攻撃を1回防御",
      "nagibato_code": [
        "addShield",
        1,
        "黙っていてごめんなさい"
      ]
    }
  },
  {
    "id": "3-041",
    "character": "百江なぎさ",
    "suit_string": "Ng",
    "Lv": 25,
    "MP": 2000,
    "HP": 20000,
    "cost": 9,
    "main": {
      "name": "なぎさの想い",
      "desc": "MPの2倍ダメージ",
      "nagibato_code": [
        "attack",
        200,
        "なぎさの想い",
        "MPの2倍ダメージ"
      ]
    },
    "sub": {
      "name": "やれやれなのです",
      "desc": "このターンのチャージMPを30％アップ",
      "nagibato_code": [
        "chargeUp",
        30,
        "やれやれなのです"
      ]
    }
  },
  {
    "id": "3-042",
    "character": "まどか＆ほむら",
    "suit_string": "MdHm",
    "Lv": 15,
    "MP": 1500,
    "HP": 15000,
    "cost": 7
  },
  {
    "id": "3-043",
    "character": "まどか＆さやか",
    "suit_string": "MdSy",
    "Lv": 15,
    "MP": 1300,
    "HP": 17000,
    "cost": 7
  },
  {
    "id": "3-044",
    "character": "杏子＆ほむら",
    "suit_string": "KyHm",
    "Lv": 15,
    "MP": 1600,
    "HP": 14000,
    "cost": 7
  },
  {
    "id": "3-045",
    "character": "まどか＆さやか",
    "suit_string": "MdSy",
    "Lv": 15,
    "MP": 1500,
    "HP": 15000,
    "cost": 7
  },
  {
    "id": "3-046",
    "character": "まどか＆さやか",
    "suit_string": "MdSy",
    "Lv": 15,
    "MP": 1350,
    "HP": 16500,
    "cost": 7
  },
  {
    "id": "3-047",
    "character": "杏子＆さやか",
    "suit_string": "KySy",
    "Lv": 15,
    "MP": 1650,
    "HP": 13500,
    "cost": 7
  },
  {
    "id": "3-048",
    "character": "杏子＆さやか",
    "suit_string": "KySy",
    "Lv": 15,
    "MP": 1350,
    "HP": 16500,
    "cost": 7
  },
  {
    "id": "3-049",
    "character": "ほむら＆さやか",
    "suit_string": "HmSy",
    "Lv": 15,
    "MP": 1700,
    "HP": 13000,
    "cost": 7
  },
  {
    "id": "3-050",
    "character": "杏子＆ほむら",
    "suit_string": "KyHm",
    "Lv": 15,
    "MP": 1400,
    "HP": 16000,
    "cost": 7
  },
  {
    "id": "3-051",
    "character": "さやか＆マミ",
    "suit_string": "SyMm",
    "Lv": 15,
    "MP": 1300,
    "HP": 17000,
    "cost": 7
  },
  {
    "id": "3-052",
    "character": "さやか＆なぎさ",
    "suit_string": "SyNg",
    "Lv": 15,
    "MP": 1500,
    "HP": 15000,
    "cost": 7
  },
  {
    "id": "3-053",
    "character": "まどか＆ほむら＆マミ",
    "suit_string": "MdHmMm",
    "Lv": 20,
    "MP": 1800,
    "HP": 18000,
    "cost": 8,
    "sub": {
      "name": "仲良く出来ればいいのに",
      "desc": "残りHP50％以下でメインMP10％上昇",
      "nagibato_code": [
        "crisisBoost",
        10,
        "仲良く出来ればいいのに"
      ]
    }
  },
  {
    "id": "3-054",
    "character": "まどか＆ほむら",
    "suit_string": "MdHm",
    "Lv": 20,
    "MP": 1800,
    "HP": 18000,
    "cost": 8,
    "sub": {
      "name": "待たせちゃってごめんね",
      "desc": "メインカードMPが10％アップ",
      "nagibato_code": [
        "addMP",
        10,
        "待たせちゃってごめんね"
      ]
    }
  },
  {
    "id": "3-055",
    "character": "魔法少女",
    "suit_string": "Sestet",
    "Lv": 30,
    "MP": 2250,
    "HP": 22500,
    "cost": 10,
    "main": {
      "name": "夢に見た世界",
      "desc": "HPとソウルジェムを100％回復",
      "nagibato_code": [
        "addHPSG",
        100,
        "夢に見た世界"
      ]
    },
    "sub": {
      "name": "皆一緒！",
      "desc": "残りHP50％以下でメインMP50％上昇",
      "nagibato_code": [
        "crisisBoost",
        50,
        "皆一緒！"
      ]
    }
  },
  {
    "id": "P-001",
    "character": "魔法少女",
    "suit_string": "Quintet",
    "Lv": 15,
    "MP": 1500,
    "HP": 15000,
    "cost": 7,
    "sub": {
      "name": "みんなを迎えにいかないと",
      "desc": "メインカードMPが20％アップ",
      "nagibato_code": [
        "addMP",
        20,
        "みんなを迎えにいかないと"
      ]
    }
  }
]
