const { Factory, EasyScore, System } = Vex.Flow;

const comment = document.getElementById('comment');
const output = document.getElementById('output');
const label = document.getElementById('label');
const fingering = document.getElementById('fingering');

const valves = [];
valves[0] = document.getElementById('valve-1');
valves[1] = document.getElementById('valve-2');
valves[2] = document.getElementById('valve-3');

let lowestPitch = 54;
let highestPitch = 83;

let currentNote = getRandomNote(lowestPitch, highestPitch);
// let currentNote = getNote(lowestPitch);

const searchParams = new URLSearchParams(window.location.search);

for ([key, value] of searchParams) {
  switch (key) {
    case 'min':
      lowestPitch = parseInt(value);
      break;
    case 'max':
      highestPitch = parseInt(value);
      break;
    default:
      break;
  }
}

(async function main() {
  await loadAudioFiles();

  comment.innerHTML = '(Klick, Tap oder Leertaste)';
  displayNote(currentNote.name);

  window.addEventListener("pointerup", displayOrPlay);
  window.addEventListener("keypress", (e) => {
    if (e.code === 'Space') {
      displayOrPlay()
    }
  });
})();

async function displayOrPlay() {
  if (currentNote === null) {
    label.classList.add('hidden');
    fingering.classList.add('hidden');

    stopLastNote();

    currentNote = getRandomNote(lowestPitch, highestPitch);
    // currentNote = getNextNote();
    displayNote(currentNote.name);
  } else {
    // display label and fingering
    label.innerHTML = currentNote.label;
    label.classList.remove('hidden');

    for (let i = 0; i < 3; i++) {
      const finger = currentNote.fingering[i];
      const valve = valves[i];

      if (finger) {
        valve.classList.add('pressed');
      } else {
        valve.classList.remove('pressed');
      }
    }

    fingering.classList.remove('hidden');

    await resumeAudio();
    playNote(currentNote.pitch - 2);

    currentNote = null;
  }
}

/************************************************************
 * Notes
 */
function getRandomNote(lowestPitch, highestPitch) {
  const pitch = lowestPitch + Math.floor((highestPitch - lowestPitch + 1) * Math.random());
  const sharp = (Math.random() >= 0.5);
  const note = getNote(pitch, sharp);

  return note;
}

let nextPitch = lowestPitch;

function getNextNote() {
  const note = getNote(++nextPitch);
  return note;
}

function getNote(pitch, sharp = true) {
  const name = getNoteName(pitch, sharp);
  const label = getNoteLabel(pitch, sharp);
  const fingering = getFingering(pitch);

  return { pitch, sharp, name, label, fingering };
}

function getNoteName(pitch, sharp = true) {
  const noteNames = [
    'C',
    ['C#', 'Db'],
    'D',
    ['D#', 'Eb'],
    'E',
    'F',
    ['F#', 'Gb'],
    'G',
    ['G#', 'Ab'],
    'A',
    ['A#', 'Bb'],
    'B',
  ];

  const octave = Math.floor(pitch / 12) - 1;
  const pitchClass = pitch % 12;
  let noteName = noteNames[pitchClass];

  if (typeof noteName === 'object') {
    if (sharp) {
      noteName = noteName[0];
    } else {
      noteName = noteName[1];
    }
  }

  return `${noteName}${octave}`;
}

function getNoteLabel(pitch, sharp = true) {
  const noteLabels = [
    'c',
    ['cis', 'des'],
    'd',
    ['dis', 'es'],
    'e',
    'f',
    ['fis', 'ges'],
    'g',
    ['gis', 'as'],
    'a',
    ['ais', 'b'],
    'h',
  ];

  const octave = Math.floor(pitch / 12) - 1;
  const numQuotes = Math.max(0, octave - 3);
  const pitchClass = pitch % 12;
  let noteLabel = noteLabels[pitchClass];

  if (typeof noteLabel === 'object') {
    if (sharp) {
      noteLabel = noteLabel[0];
    } else {
      noteLabel = noteLabel[1];
    }
  }

  for (let i = 0; i < numQuotes; i++) {
    noteLabel += "'";
  }

  return noteLabel;
}

function displayNote(noteName = 'c0') {
  output.innerHTML = '';
  const factory = new Factory({ renderer: { elementId: 'output', width: 200, height: 150 } });
  const score = factory.EasyScore();
  const system = factory.System();
  const voice = score.voice(score.notes(`${noteName}/1`));
  const stave = system.addStave({ voices: [voice] });

  stave.addClef('treble');
  stave.setWidth(120);
  stave.draw();

  system.format();

  if (noteName !== 'c0') {
    voice.draw();
  }
}


/************************************************************
 * Fingering
 */
function getFingering(pitch) {
  const fingerings = [
    [true, true, true],
    [true, false, true],
    [false, true, true],
    [true, true, false],
    [true, false, false],
    [false, true, false],
    [false, false, false],
    [true, true, true],
    [true, false, true],
    [false, true, true],
    [true, true, false],
    [true, false, false],
    [false, true, false],
    [false, false, false],
    [false, true, true],
    [true, true, false],
    [true, false, false],
    [false, true, false],
    [false, false, false],
    [true, true, false],
    [true, false, false],
    [false, true, false],
    [null, null, null],
    [null, null, null],
    [null, null, null],
    [null, null, null],
    [null, null, null],
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];

  return fingerings[pitch - lowestPitch];
}

/************************************************************
 * Audio
 */
const audioContext = new AudioContext();
const audioBuffers = [];

const lowestSamplePitch = 48;
const sampleInterval = 3;

let audioSource = null;
let audioGain = null;

async function resumeAudio() {
  if (audioContext.state !== 'running') {
    await audioContext.resume();
  }
}

async function loadAudioFiles() {
  const audioFileNames = [
    'C3v12.flac',
    'D#3v12.flac',
    'F#3v12.flac',
    'A3v12.flac',
    'C4v12.flac',
    'D#4v12.flac',
    'F#4v12.flac',
    'A4v12.flac',
    'C5v12.flac',
    'D#5v12.flac',
    'F#5v12.flac',
    'A5v12.flac',
    'C6v12.flac',
  ];

  for (let i = 0; i < audioFileNames.length; i++) {
    const url = ('sounds/' + audioFileNames[i]).replace('#', '%23');
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    audioBuffers[i] = await audioContext.decodeAudioData(arrayBuffer);
  }
}

function playNote(pitch) {
  const time = audioContext.currentTime;
  const sampleIndex = Math.round((pitch - lowestSamplePitch) / sampleInterval);
  const samplePitch = lowestSamplePitch + sampleIndex * sampleInterval;
  const detune = 100 * (pitch - samplePitch);

  audioGain = audioContext.createGain();
  audioGain.connect(audioContext.destination);
  audioGain.gain.value = 1;
  audioGain.gain.setValueAtTime(1, time);

  audioSource = audioContext.createBufferSource();
  audioSource.connect(audioGain);
  audioSource.buffer = audioBuffers[sampleIndex];
  audioSource.detune.value = detune;

  audioSource.start(time);
}

const fadeOutDuration = 0.1;

function stopLastNote() {
  if (audioSource !== null && audioGain !== null) {
    const time = audioContext.currentTime;
    audioSource.stop(time + fadeOutDuration);
    audioGain.gain.setValueAtTime(1, time);
    audioGain.gain.linearRampToValueAtTime(0, time + fadeOutDuration);
  }
}
