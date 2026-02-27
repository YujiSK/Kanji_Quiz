/**
 * main.js - エントリーポイント・画面遷移・問題ループ制御
 */

// ゲーム状態
const state = {
  currentStageId: null, // 現在のステージID（例: 'lv1', 'lv2b'）
  stageData: null,
  questionIndex: 0,
  results: [],          // { question, isCorrect }
  totalCoins: 0,
  isAnswering: false,   // 二重回答防止フラグ
  isRescueMode: false,  // レスキューチャレンジ中フラグ
  rescueQuestions: [],  // レスキュー対象の question 配列
};

/* ========================================
   初期化
   ======================================== */
document.addEventListener('DOMContentLoaded', () => {
  // ステージ一覧を描画
  renderStageList(STAGES, startStage);

  // タイトル → ステージ選択
  document.getElementById('btn-start').addEventListener('click', () => {
    goToStageSelect();
  });

  // ステージ選択 → タイトルへ戻る
  document.getElementById('btn-back-title').addEventListener('click', () => {
    showScreen('screen-title');
  });

  // 「つぎへ」ボタン
  document.getElementById('btn-next').addEventListener('click', () => {
    nextQuestion();
  });

  // クリア画面 → もういちど
  document.getElementById('btn-retry').addEventListener('click', () => {
    if (state.isRescueMode) {
      startRescueMode(state.rescueQuestions);
    } else {
      startStage(state.currentStageId);
    }
  });

  // クリア画面 → ステージ選択
  document.getElementById('btn-stage-select').addEventListener('click', () => {
    state.isRescueMode = false;
    goToStageSelect();
  });

  // クリア画面 → レスキューチャレンジ
  document.getElementById('btn-rescue').addEventListener('click', () => {
    const rescues = getRescueMissions(state.results);
    startRescueMode(rescues.map(r => r.question));
  });
});

/* ========================================
   ステージ選択画面へ（進捗を再描画してから表示）
   ======================================== */
function goToStageSelect() {
  renderStageList(STAGES, startStage);
  showScreen('screen-select');
}

/* ========================================
   ステージ開始
   ======================================== */
async function startStage(stageId) {
  state.currentStageId = stageId;
  state.questionIndex = 0;
  state.results = [];
  state.totalCoins = 0;
  state.isAnswering = false;
  state.isRescueMode = false;
  state.rescueQuestions = [];

  try {
    state.stageData = await loadStage(stageId);
  } catch (e) {
    alert('ステージデータの読み込みに失敗しました。');
    return;
  }

  showScreen('screen-quiz');
  showQuestion();
}

/* ========================================
   レスキューチャレンジ開始
   ======================================== */
function startRescueMode(questions) {
  if (questions.length === 0) return;

  // 選択肢をシャッフルして丸暗記クリックを防ぐ
  const shuffled = questions.map(q => ({
    ...q,
    choices: shuffleArray(q.choices),
  }));

  state.isRescueMode = true;
  state.rescueQuestions = questions; // シャッフル前を保存（リトライ用）
  state.questionIndex = 0;
  state.results = [];
  state.totalCoins = 0;
  state.isAnswering = false;

  // stageData の questions だけ差し替えて既存フローを再利用
  state.stageData = {
    ...state.stageData,
    stage_title: 'レスキューチャレンジ',
    sea_area: '🆘 レスキュー海域',
    questions: shuffled,
  };

  showScreen('screen-quiz');
  showQuestion();
}

/* ========================================
   問題表示
   ======================================== */
function showQuestion() {
  state.isAnswering = false;  // 二重回答フラグをリセット

  const q = state.stageData.questions[state.questionIndex];
  const total = state.stageData.questions.length;

  updateQuizHeader(
    state.stageData.sea_area,
    state.questionIndex + 1,
    total,
    state.totalCoins
  );

  renderQuestion(q);

  // 選択肢クリックイベントを設定
  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => onChoiceSelected(btn.dataset.value));
  });
}

/* ========================================
   選択肢が選ばれたとき
   ======================================== */
function onChoiceSelected(selected) {
  if (state.isAnswering) return;  // 二重回答防止
  state.isAnswering = true;

  const q = state.stageData.questions[state.questionIndex];
  const isCorrect = checkAnswer(selected, q.answer);

  // 選択されたボタンにマーク
  markSelectedChoice(selected);

  // 結果を記録
  state.results.push({ question: q, isCorrect });

  // コインを加算（正解時のみ）
  if (isCorrect) {
    state.totalCoins += q.reward.coins;
  }

  // フィードバック表示
  showFeedback(isCorrect, q, q.reward.coins, state.totalCoins);
}

/* ========================================
   次の問題へ
   ======================================== */
function nextQuestion() {
  state.questionIndex++;
  const total = state.stageData.questions.length;

  if (state.questionIndex >= total) {
    // 全問終了 → クリア画面
    // 通常モードのみ進捗を保存（レスキューは保存しない）
    if (!state.isRescueMode) {
      const { accuracy } = calcStats(state.results);
      saveProgress(state.currentStageId, accuracy, state.totalCoins);
    }

    // レスキューモードで全問正解なら+3コインボーナス
    let rescueBonus = 0;
    if (state.isRescueMode) {
      const allCorrect = state.results.every(r => r.isCorrect);
      if (allCorrect) {
        rescueBonus = 3;
        state.totalCoins += rescueBonus;
      }
    }
    renderClearScreen(state.stageData, state.results, state.isRescueMode, rescueBonus);
    showScreen('screen-clear');
  } else {
    showQuestion();
  }
}
