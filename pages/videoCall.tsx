import { useRef } from "react";
import { firestore, servers } from "../utils/firebase";
import "@firebase/firestore-types";
import { FirebaseDefaults } from "@firebase/util";
import { DocumentSnapshot } from "firebase/firestore";
import { DocumentChange } from "@firebase/firestore-types";

export const Video = () => {
  //will reference DOM/browser elements
  const webcamButtonRef = useRef();
  const webcamVideoRef = useRef<HTMLVideoElement>();
  const callButtonRef = useRef();
  const callInputRef = useRef();
  const answerButtonRef = useRef();
  const remoteVideoRef = useRef<HTMLVideoElement>();
  const hangupButtonRef = useRef();

  //global pc connection
  const pc = new RTCPeerConnection(servers);

  let localStream: any = null;
  let remoteStream: any = null;

  //will launch webcam/audio permissions
  const webCamHandler = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
  };
  //from WebRTC API, allows acces to audi and video stream from peer
  remoteStream = new MediaStream();

  localStream.getTracks().forEach((track: MediaStreamTrack) => {
    pc.addTrack(track, localStream);
  });

  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track: MediaStreamTrack) => {
      remoteStream.addTrack(track);
    });
  };

  webcamVideoRef!.current!.srcObject = localStream;
  remoteVideoRef!.current!.srcObject = remoteStream;

  const callHandler = async () => {
    const callDoc = firestore.collection("calls").doc();
    const offerCandidates = callDoc.collection("offerCandidates");
    const answerCandidates = callDoc.collection("answerCandidates");

    //@ts-ignore
    callInputRef.current.value = callDoc.id;

    pc.onicecandidate = (event) => {
      event.candidate && offerCandidates.add(event.candidate.toJSON());
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await callDoc.set({ offer });

    // callDoc.onSnapshot((snapshot) => {
    //   const data = snapshot.data();
    //   if (!pc.currentRemoteDescription && data?.answer) {
    //     const answerDescription = new RTCSessionDescription(data.answer);
    //     pc.setRemoteDescription(answerDescription);
    //   }
    // });

    await callDoc.set({ offer });

    callDoc.onSnapshot((snapshot: any) => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data?.answer) {
        const answerDescription: RTCSessionDescription =
          new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    answerCandidates.onSnapshot((snapshot: any) => {
      snapshot.docChanges().forEach((change: DocumentChange) => {
        if (change.type === "added") {
          const candidate: RTCIceCandidate = new RTCIceCandidate(
            change.doc.data()
          );
          pc.addIceCandidate(candidate);
        }
      });
    });

    //hangupButtonRef.current.disabled = false;
  };

  const answerHandler = async () => {
    //@ts-ignore
    const callId = callInputRef.current.value;
    const callDoc = firestore.collection("calls").doc(callId);
    const answerCandidates = callDoc.collection("answerCandidates");
    const offerCandidates = callDoc.collection("offerCandidates");

    pc.onicecandidate = (event) => {
      event.candidate && answerCandidates.add(event.candidate.toJSON());
    };

    const callData = (await callDoc.get()).data();

    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };
    await callDoc.update({ answer });

    offerCandidates.onSnapshot((snapshot: any) => {
      snapshot.docChanges().forEach((change: DocumentChange) => {
        if (change.type === "added") {
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  };

  const hangupHandler = () => {
    localStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    remoteStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
  };
};
export default Video;
