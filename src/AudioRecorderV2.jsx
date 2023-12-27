import { useState, useRef, useEffect } from "react";

const mimeType = "audio/webm";

const AudioRecorder = () => {
  const [recordingStatus, setRecordingStatus] = useState("inactive");
  const [audio, setAudio] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [timeRecorded, setTimeRecorded] = useState(0);
  const mediaRecorder = useRef(null);
  const intervalRef = useRef(null);
  const [actualRecordingTime, setActualRecordingTime] = useState(0);
  const actualRecordingIntervalRef = useRef(null);

  useEffect(() => {
    if (recordingStatus === "recording") {
      intervalRef.current = setInterval(() => {
        setTimeRecorded((prev) => prev + 1);
        setActualRecordingTime((prev) => prev + 1);
        // Xuất blob mỗi 10 giây
        if (actualRecordingTime !== 0 && actualRecordingTime % 5 === 0) {
          if (
            mediaRecorder.current &&
            mediaRecorder.current.state === "recording"
          ) {
            mediaRecorder.current.requestData();
          }
        }
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [recordingStatus, timeRecorded, actualRecordingTime]);

  const getMicrophonePermission = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const media = new MediaRecorder(mediaStream, { type: mimeType });

      mediaRecorder.current = media;
      return mediaStream;
    } catch (err) {
      alert(err.message);
    }
  };

  const startRecording = async () => {
    const stream = await getMicrophonePermission();
    if (!stream) return;

    setRecordingStatus("recording");
    let localAudioChunks = [];

    mediaRecorder.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        localAudioChunks.push(event.data);
        console.log("Blob of 10 seconds recorded:", event.data);
      }
    };

    mediaRecorder.current.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: mimeType });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudio(audioUrl);
      setAudioChunks([]);
    };

    mediaRecorder.current.start();
    setAudioChunks(localAudioChunks);
  };

  const stopRecording = () => {
    setRecordingStatus("inactive");
    clearInterval(intervalRef.current);
    setTimeRecorded(0);
    mediaRecorder.current.stop();
  };
  console.log(recordingStatus);
  const pauseRecording = () => {
    if (mediaRecorder.current.state === "recording") {
      mediaRecorder.current.pause();
      clearInterval(intervalRef.current);
      setRecordingStatus("paused");
    } else {
      mediaRecorder.current.resume();
      setRecordingStatus("recording");
    }
  };

  return (
    <div>
      <h2>Audio Recorder</h2>
      <main>
        <div className="audio-controls">
          {recordingStatus !== "recording" ? (
            <button onClick={startRecording} type="button">
              Start Recording
            </button>
          ) : (
            <button onClick={stopRecording} type="button">
              Stop Recording
            </button>
          )}
          {actualRecordingTime > 0 && (
            <button onClick={pauseRecording} type="button">
              {recordingStatus === "paused"
                ? "Resume Recording"
                : "Pause Recording"}
            </button>
          )}
        </div>
        <div>Time Recorded: {timeRecorded} seconds</div>
        {audio && (
          <div className="audio-player">
            <audio src={audio} controls></audio>
            <a download href={audio}>
              Download Recording
            </a>
          </div>
        )}
      </main>
    </div>
  );
};

export default AudioRecorder;
