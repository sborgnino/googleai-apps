import React, { useState, useRef } from 'react';
import { Mic, Square, Save, RotateCcw, CheckCircle2, AlertCircle, Edit3 } from 'lucide-react';
import { Button } from '../components/Button';
import { processWorkoutAudio } from '../services/geminiService';
import { AppState, WorkoutSession } from '../types';
import { useWorkoutStore } from '../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';

export const RecordWorkout: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [draftSession, setDraftSession] = useState<Partial<WorkoutSession> | null>(null);
  
  // Refs for mutable data that doesn't need immediate re-renders
  const audioChunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>('audio/webm');
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  const { addSession } = useWorkoutStore();
  const navigate = useNavigate();

  // Visualization logic
  const startVisualizer = (audioStream: MediaStream) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(audioStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    analyserRef.current = analyser;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        ctx.fillStyle = `rgb(${barHeight + 100}, 150, 250)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  };

  const startRecording = async () => {
    setError(null);
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(audioStream);
      
      // Reset chunks
      audioChunksRef.current = [];
      
      const recorder = new MediaRecorder(audioStream);
      setMediaRecorder(recorder);
      
      // Store mimeType immediately
      mimeTypeRef.current = recorder.mimeType;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start();
      setState(AppState.RECORDING);
      startVisualizer(audioStream);

      // Timer
      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

    } catch (err) {
      console.error(err);
      setError("Could not access microphone. Please ensure permissions are granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && state === AppState.RECORDING) {
      mediaRecorder.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      
      mediaRecorder.onstop = () => {
        processAudio();
      };
    }
  };

  const processAudio = async () => {
    setState(AppState.PROCESSING);
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
      const result = await processWorkoutAudio(audioBlob);
      setDraftSession(result);
      setState(AppState.REVIEW);
    } catch (err) {
      console.error(err);
      setError("Failed to process audio. Please try again.");
      setState(AppState.ERROR);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    if (draftSession && draftSession.exercises) {
      addSession({
        date: draftSession.date || new Date().toISOString().split('T')[0],
        exercises: draftSession.exercises,
        raw_transcription: draftSession.raw_transcription || '',
        notes: draftSession.notes
      });
      navigate('/history');
    }
  };

  const reset = () => {
    setState(AppState.IDLE);
    audioChunksRef.current = [];
    setRecordingDuration(0);
    setDraftSession(null);
    setError(null);
  };

  if (state === AppState.PROCESSING) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="relative w-24 h-24">
           <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
           <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
           <ActivityIcon className="absolute inset-0 m-auto text-blue-500 w-8 h-8 animate-pulse" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white">Analyzing Workout...</h3>
          <p className="text-slate-400 mt-2">Extracting exercises, sets, and reps</p>
        </div>
      </div>
    );
  }

  if (state === AppState.REVIEW && draftSession) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" />
              Workout Extracted
            </h2>
            <span className="text-sm text-slate-400 bg-slate-700 px-2 py-1 rounded">
              {draftSession.date}
            </span>
          </div>

          <div className="space-y-4 mb-6">
            {draftSession.exercises?.map((ex, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
                <div>
                  <p className="font-semibold text-lg">{ex.name}</p>
                  <p className="text-sm text-slate-400">
                    {ex.sets ? `${ex.sets} sets` : ''} 
                    {ex.sets && ex.reps ? ' × ' : ''}
                    {ex.reps ? `${ex.reps} reps` : ''}
                    {ex.duration_minutes ? `${ex.duration_minutes} mins` : ''}
                    {ex.weight ? ` @ ${ex.weight}kg` : ''}
                  </p>
                </div>
                <Edit3 className="w-4 h-4 text-slate-500 hover:text-blue-400 cursor-pointer" />
              </div>
            ))}
          </div>

          <div className="bg-slate-900/50 p-4 rounded-lg text-sm text-slate-300 italic border border-slate-700">
            "{draftSession.raw_transcription}"
          </div>
          
          {draftSession.notes && (
            <div className="mt-4 text-sm text-slate-400">
              <span className="font-semibold text-slate-300">Note: </span>
              {draftSession.notes}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={reset} className="flex-1">
            <RotateCcw className="w-4 h-4 mr-2" />
            Discard
          </Button>
          <Button onClick={handleSave} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save Workout
          </Button>
        </div>
      </div>
    );
  }

  if (state === AppState.ERROR) {
     return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
           <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
           <h3 className="text-xl font-bold text-white mb-2">Something went wrong</h3>
           <p className="text-slate-400 mb-6">{error}</p>
           <Button onClick={reset}>Try Again</Button>
        </div>
     )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
       <div className="relative mb-8">
         <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 ${state === AppState.RECORDING ? 'bg-red-500/20 ring-4 ring-red-500/30 scale-110' : 'bg-slate-800 ring-4 ring-slate-700'}`}>
            {state === AppState.RECORDING ? (
                <div className="flex flex-col items-center">
                    <span className="text-3xl font-mono font-bold text-red-500 mb-2">
                        {formatTime(recordingDuration)}
                    </span>
                    <canvas ref={canvasRef} width="100" height="40" className="opacity-75"></canvas>
                </div>
            ) : (
                <Mic className="w-20 h-20 text-slate-400" />
            )}
         </div>
       </div>

       <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-2">
              {state === AppState.RECORDING ? 'Listening...' : 'Record Your Workout'}
          </h2>
          <p className="text-slate-400 max-w-xs mx-auto">
              {state === AppState.RECORDING 
                ? "Describe your exercises, sets, reps, and weights clearly." 
                : "Tap the mic and say: 'I did 5 sets of 10 pushups and ran for 20 minutes'"}
          </p>
       </div>

       {state === AppState.IDLE ? (
           <button 
             onClick={startRecording}
             className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-6 shadow-lg shadow-blue-900/50 transition-transform hover:scale-105 active:scale-95"
           >
              <Mic className="w-8 h-8" />
           </button>
       ) : (
           <button 
             onClick={stopRecording}
             className="bg-red-600 hover:bg-red-500 text-white rounded-full p-6 shadow-lg shadow-red-900/50 transition-transform hover:scale-105 active:scale-95"
           >
              <Square className="w-8 h-8 fill-current" />
           </button>
       )}
    </div>
  );
};

const ActivityIcon = ({className}:{className?:string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
)