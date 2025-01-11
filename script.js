const { Factory, EasyScore, System } = Vex.Flow;

const comment = document.getElementById('comment');
const output = document.getElementById('output');
const label = document.getElementById('label');
const fingering = document.getElementById('fingering');

const valves = [];
valves[0] = document.getElementById('valve-1');
valves[1] = document.getElementById('valve-2');
valves[2] = document.getElementById('valve-3');

const lowestTrumpetPitch = 54;
const highestTrumpetPitch = 83;

const tristansLowestPitch = 54;
const tristansHighestPitch = 75;

// let currentNote = getRandomNote(tristansLowestPitch, tristansHighestPitch);
let currentNote = getNote(lowestTrumpetPitch);

(async function main() {
  await loadAudioFiles();

  comment.innerHTML = '(klicken oder Leertaste drücken)';
  displayNote(currentNote.name);

  window.addEventListener('click', displayOrPlay);
  window.addEventListener("keypress", (e) => {
    if (e.code === 'Space') {
      displayOrPlay()
    }
  });
})();

async function displayOrPlay() {
  if (audioContext.state !== 'running') {
    await audioContext.resume();
  }

  if (currentNote === null) {
    label.classList.add('hidden');
    fingering.classList.add('hidden');

    stopLastNote();
  
    // currentNote = getRandomNote(tristansLowestPitch, tristansHighestPitch);
    currentNote = getNextNote();
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

let nextPitch = lowestTrumpetPitch;

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

function displayNote(noteName) {
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
  voice.draw();
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

  return fingerings[pitch - lowestTrumpetPitch];
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

async function loadAudioFiles() {
  const audioFileNames = [
    'C3v12.ogg',
    'D#3v12.ogg',
    'F#3v12.ogg',
    'A3v12.ogg',
    'C4v12.ogg',
    'D#4v12.ogg',
    'F#4v12.ogg',
    'A4v12.ogg',
    'C5v12.ogg',
    'D#5v12.ogg',
    'F#5v12.ogg',
    'A5v12.ogg',
    'C6v12.ogg',
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
