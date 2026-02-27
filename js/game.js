/**
 * game.js - ゲームロジック
 * ステージデータの読み込み・正誤判定・スコア計算
 */

const STAGES = [
  { level: 1, file: 'data/stage_lv1.json', icon: '🏖️', area: '浜辺' },
  { level: 2, file: 'data/stage_lv2.json', icon: '🐚', area: '浅瀬' },
  { level: 3, file: 'data/stage_lv3.json', icon: '🌿', area: '海の森' },
  { level: 4, file: 'data/stage_lv4.json', icon: '⚓', area: '港町' },
  { level: 5, file: 'data/stage_lv5.json', icon: '⛈️', area: '嵐の海域' },
  { level: 6, file: 'data/stage_lv6.json', icon: '🔱', area: '深海神殿' },
];

const QUESTION_TYPE_LABELS = {
  reading:    '読み方',
  writing:    '書き方',
  fill_blank: '穴うめ',
  context:    '文の意味',
  typo_fix:   '誤字さがし',
  radical:    '部首',
};

/**
 * ステージデータをfetchで取得する
 * @param {number} level - 1〜6
 * @returns {Promise<Object>} ステージデータ
 */
async function loadStage(level) {
  const stage = STAGES.find(s => s.level === level);
  if (!stage) throw new Error(`Invalid level: ${level}`);
  const res = await fetch(stage.file);
  if (!res.ok) throw new Error(`Failed to load ${stage.file}`);
  return res.json();
}

/**
 * 正誤判定
 * @param {string} selected - ユーザーが選んだ選択肢
 * @param {string} answer   - 正解
 * @returns {boolean}
 */
function checkAnswer(selected, answer) {
  return selected === answer;
}

/**
 * ステージ全体の報酬を集計する
 * @param {Array} results - { question, isCorrect } の配列
 * @returns {{ totalCoins: number, cards: Array }}
 */
function calcReward(results) {
  let totalCoins = 0;
  const cards = [];

  for (const { question, isCorrect } of results) {
    if (isCorrect) {
      totalCoins += question.reward.coins;
      cards.push({
        rarity: question.reward.card_rarity,
        question: question.question,
      });
    }
  }

  return { totalCoins, cards };
}

/**
 * 復習が必要な問題を返す（rescue_mission=true かつ不正解）
 * @param {Array} results - { question, isCorrect } の配列
 * @returns {Array}
 */
function getRescueMissions(results) {
  return results.filter(r => r.question.rescue_mission && !r.isCorrect);
}

/**
 * 配列をフィッシャー–イェーツ法でシャッフルして新しい配列を返す
 * @param {Array} arr
 * @returns {Array}
 */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 正解数・スコアを集計する
 * @param {Array} results
 * @returns {{ correct: number, total: number, accuracy: number }}
 */
function calcStats(results) {
  const total = results.length;
  const correct = results.filter(r => r.isCorrect).length;
  const accuracy = Math.round((correct / total) * 100);
  return { correct, total, accuracy };
}
