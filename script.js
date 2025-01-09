const { Factory, EasyScore, System } = Vex.Flow;

const output = document.getElementById('output');
const label = document.getElementById('label');

const tristansLowestPitch = 54;
const tristansHighestPitch = 75;

let currentNote = getRandomNote(tristansLowestPitch, tristansHighestPitch);

(async function main() {
  await loadAudioFiles();

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
    label.innerHTML = '';
    stopLastNote();
    currentNote = getRandomNote(tristansLowestPitch, tristansHighestPitch);
    displayNote(currentNote.name);
  } else {
    label.innerHTML = '&rarr; ' + currentNote.label;
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
  const name = getNoteName(pitch, sharp);
  const label = getNoteLabel(pitch, sharp);

  return { pitch, sharp, name, label };
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
    'C',
    ['Cis', 'Des'],
    'D',
    ['Dis', 'Es'],
    'E',
    'F',
    ['Fis', 'Ges'],
    'G',
    ['Gis', 'As'],
    'A',
    ['Ais', 'B'],
    'H',
  ];

  const pitchClass = pitch % 12;
  let noteLabel = noteLabels[pitchClass];

  if (typeof noteLabel === 'object') {
    if (sharp) {
      noteLabel = noteLabel[0];
    } else {
      noteLabel = noteLabel[1];
    }
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
    audioGain.gain.linearRampToValueAtTime(0, time + fadeOutDuration);
  }
}
