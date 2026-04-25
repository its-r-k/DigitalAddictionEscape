/**
 * game.js — Digital Addiction: The Rogue-lite Escape
 * State machine driving story progression & Cognitive Load meter.
 */

'use strict';

/* ================================================================
   GAME DATA — Story Stages
   Each stage defines: narrative, enemy, obstacle, and three plans
   where index 0 is always the CORRECT implementation intention.
   ================================================================ */
const STAGES = [
  {
    id: 1,
    storyText:
      'You wake up standing on a conveyor belt moving through a blinding neon tunnel. ' +
      'Flashing images and auto-playing videos surround you. It\'s comfortable here. ' +
      'You don\'t have to think.',
    enemy: 'The Doomscroll',
    obstacle:
      'The urge to numb your baseline stress by watching "just one more" short video.',
    plans: [
      {
        text: '"If I feel the urge to passively scroll, then I will put my device face down and recall my primary goal for the day."',
        isCorrect: true,
      },
      {
        text: '"I will just watch for five more minutes."',
        isCorrect: false,
      },
      {
        text: '"I will aggressively delete all my apps right now."',
        isCorrect: false,
      },
    ],
    correctFeedback:
      '✓ CORRECT — You step off the belt. The urge recedes as you remember why you entered the Labyrinth. Cognitive Load stabilises.',
    wrongFeedback:
      '✗ WRONG — The belt accelerates. The Doomscroll tightens its grip. Cognitive Load surges.',
  },
  {
    id: 2,
    storyText:
      'You step off the conveyor belt into a dark, quiet corridor. Suddenly, a buzzing ' +
      'sensation erupts in your pocket. Then your wrist. Then your bag. ' +
      'There are no messages, but the anticipation is deafening.',
    enemy: 'The Phantom Vibration',
    obstacle:
      'The anxiety of missing out on an important message, pulling your focus away from the present moment.',
    plans: [
      {
        text: '"If I feel a phantom buzz, then I will remind myself that checking my screen will not resolve my internal anxiety."',
        isCorrect: true,
      },
      {
        text: '"I will check my phone quickly just to be sure."',
        isCorrect: false,
      },
      {
        text: '"I will turn my ringer volume up to the maximum."',
        isCorrect: false,
      },
    ],
    correctFeedback:
      '✓ CORRECT — The buzzing fades. You recognise it as neural noise, not urgency. The corridor brightens slightly.',
    wrongFeedback:
      '✗ WRONG — Every check spawns three new phantom alerts. The Phantom Vibration grows louder. Cognitive Load surges.',
  },
  {
    id: 3,
    storyText:
      'The corridor opens into a room made entirely of mirrors. Every reflection is ' +
      'shouting your own opinions back at you, mixed with things designed to make you furious. ' +
      'It\'s exhausting, yet oddly validating.',
    enemy: 'The Outrage Algorithm',
    obstacle:
      'The comfortable numbness of confirmation bias and the dopamine spike from digital arguments.',
    plans: [
      {
        text: '"If I find my heart rate rising from a post, then I will immediately close the interface and ground myself in my physical surroundings."',
        isCorrect: true,
      },
      {
        text: '"I will write a logical reply to prove them wrong."',
        isCorrect: false,
      },
      {
        text: '"I will read the comments to see if others agree with me."',
        isCorrect: false,
      },
    ],
    correctFeedback:
      '✓ CORRECT — You turn away from the mirrors. They shatter. The noise drops to silence. Your pulse slows.',
    wrongFeedback:
      '✗ WRONG — The mirrors multiply. Every reply spawns a hundred more. The Algorithm has you exactly where it wants you. Cognitive Load surges.',
  },
  {
    id: 4,
    storyText:
      'You reach the centre of the labyrinth. A massive, pulsing server rack towers ' +
      'over you, emitting pure data. It whispers that regulating your behaviour is useless. ' +
      'The system is too big. You are too tired.',
    enemy: 'Decision Fatigue',
    obstacle:
      'Complete cognitive overload and the feeling of learned helplessness against the digital architecture.',
    plans: [
      {
        text: '"If I feel overwhelmed by the system, then I will focus entirely on the single, smallest next step of my own work, ignoring the noise."',
        isCorrect: true,
      },
      {
        text: '"I will try to multitask and beat the system at its own game."',
        isCorrect: false,
      },
      {
        text: '"I will surrender and try again tomorrow."',
        isCorrect: false,
      },
    ],
    correctFeedback:
      '✓ CORRECT — One small step. Then another. The server rack stutters. You feel the exit beneath your feet.',
    wrongFeedback:
      '✗ WRONG — Multitasking fragments your last reserves. The server whispers grow louder. Cognitive Load surges.',
    successText:
      'The server rack powers down. The neon lights fade into natural sunlight. Your mind is quiet. You have escaped.',
  },
];

/* ================================================================
   CONSTANTS
   ================================================================ */
const CL_WRONG_PENALTY   = 25;   // % added on wrong answer
const CL_MAX             = 100;  // Game over threshold
const CL_INITIAL         = 0;

/* ================================================================
   STATE
   ================================================================ */
let state = {
  stageIndex:    0,    // Index into STAGES array
  cognitiveLoad: CL_INITIAL,
  locked:        false, // Prevents clicking during feedback
};

/* ================================================================
   DOM REFERENCES
   ================================================================ */
const $ = id => document.getElementById(id);

const screens = {
  title:    $('screen-title'),
  game:     $('screen-game'),
  gameover: $('screen-gameover'),
  win:      $('screen-win'),
};

const el = {
  hudStageVal:   $('hud-stage-val'),
  clBarFill:     $('cl-bar-fill'),
  clBarText:     $('cl-bar-text'),
  enemyName:     $('enemy-name'),
  storyText:     $('story-text'),
  obstacleText:  $('obstacle-text'),
  choicesList:   $('choices-list'),
  feedbackPanel: $('feedback-panel'),
  feedbackText:  $('feedback-text'),
  btnContinue:   $('btn-continue'),
};

/* ================================================================
   SCREEN MANAGEMENT
   ================================================================ */
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

/* ================================================================
   COGNITIVE LOAD
   ================================================================ */
function updateCL(newVal) {
  state.cognitiveLoad = Math.min(Math.max(newVal, 0), CL_MAX);
  const pct = state.cognitiveLoad + '%';
  el.clBarFill.style.width = pct;
  el.clBarText.textContent = pct;
  // Update CSS variable for gradient positioning
  document.documentElement.style.setProperty('--cl', pct);
}

/* ================================================================
   RENDER STAGE
   ================================================================ */
function renderStage() {
  const stage = STAGES[state.stageIndex];

  // HUD
  el.hudStageVal.textContent = `${state.stageIndex + 1} / ${STAGES.length}`;

  // Enemy
  el.enemyName.textContent = stage.enemy;

  // Story
  el.storyText.textContent = stage.storyText;

  // Obstacle
  el.obstacleText.textContent = stage.obstacle;

  // Build shuffled choices
  const shuffled = shuffleArray([...stage.plans]);
  el.choicesList.innerHTML = '';
  shuffled.forEach(plan => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = plan.text;
    btn.addEventListener('click', () => handleChoice(plan.isCorrect, btn));
    el.choicesList.appendChild(btn);
  });

  // Hide feedback
  el.feedbackPanel.classList.add('hidden');
  el.feedbackText.textContent = '';
  el.feedbackText.className = '';

  state.locked = false;
}

/* ================================================================
   HANDLE CHOICE
   ================================================================ */
function handleChoice(isCorrect, clickedBtn) {
  if (state.locked) return;
  state.locked = true;

  // Disable all buttons
  const allBtns = el.choicesList.querySelectorAll('.choice-btn');
  allBtns.forEach(b => b.setAttribute('disabled', 'true'));

  const stage = STAGES[state.stageIndex];

  if (isCorrect) {
    clickedBtn.classList.add('correct');
    showFeedback(stage.correctFeedback, 'success');
    el.btnContinue.onclick = () => advanceStage();
  } else {
    clickedBtn.classList.add('wrong');
    updateCL(state.cognitiveLoad + CL_WRONG_PENALTY);
    // Shake the game container to indicate damage
    shakeScreen();
    if (state.cognitiveLoad >= CL_MAX) {
      // Show feedback briefly then go to game over
      showFeedback(stage.wrongFeedback + ' SYSTEM OVERRIDE — COGNITIVE COLLAPSE IMMINENT.', 'failure');
      el.btnContinue.onclick = () => showScreen('gameover');
    } else {
      showFeedback(stage.wrongFeedback, 'failure');
      el.btnContinue.onclick = () => {
        // Re-render same stage with re-shuffled options
        renderStage();
      };
    }
  }
}

/* ================================================================
   ADVANCE STAGE
   ================================================================ */
function advanceStage() {
  const isLastStage = state.stageIndex === STAGES.length - 1;
  if (isLastStage) {
    showScreen('win');
    return;
  }
  state.stageIndex++;
  renderStage();
}

/* ================================================================
   FEEDBACK DISPLAY
   ================================================================ */
function showFeedback(text, type) {
  el.feedbackText.textContent = text;
  el.feedbackText.className = type; // 'success' or 'failure'
  el.feedbackPanel.classList.remove('hidden');
}

/* ================================================================
   HELPERS
   ================================================================ */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shakeScreen() {
  const panel = $('screen-game');
  panel.classList.remove('shake');
  void panel.offsetWidth; // reflow
  panel.classList.add('shake');
  setTimeout(() => panel.classList.remove('shake'), 450);
}

/* ================================================================
   GAME INIT / RESET
   ================================================================ */
function startGame() {
  state = {
    stageIndex:    0,
    cognitiveLoad: CL_INITIAL,
    locked:        false,
  };
  updateCL(0);
  renderStage();
  showScreen('game');
}

/* ================================================================
   BUTTON EVENT LISTENERS
   ================================================================ */
$('btn-start').addEventListener('click', startGame);
$('btn-restart-go').addEventListener('click', startGame);
$('btn-restart-win').addEventListener('click', startGame);
