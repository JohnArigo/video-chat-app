import { useRouter } from "next/router";
import Pusher, { Members, PresenceChannel } from "pusher-js";
import { useEffect, useRef, useState } from "react";
import Modal from "../../components/modal";
import { ICE_SERVERS } from "../../utils/iceServers";
import {
  IconCameraOff,
  IconCamera,
  IconMicrophone,
  IconMicrophoneOff,
} from "@tabler/icons";

interface Props {
  userName: string;
  roomName: string;
}
type portType = {
  height: number | undefined;
  width: number | undefined;
};

export default function Room({ userName, roomName }: Props) {
  const [micActive, setMicActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [clicked, setClicked] = useState(false);
  const router = useRouter();

  const host = useRef(false);
  // Pusher specific refs
  const pusherRef = useRef<Pusher>();
  const channelRef = useRef<PresenceChannel>();

  // Webrtc refs
  const rtcConnection = useRef<RTCPeerConnection | null>();
  const userStream = useRef<MediaStream>();

  const userVideo = useRef<HTMLVideoElement>(null);
  const partnerVideo = useRef<HTMLVideoElement>(null);
  //const partnerTwoVideo = useRef<HTMLVideoElement>(null);

  const [portSize, setPortSize] = useState<portType>({
    width: 0,
    height: 0,
  });
  //handles window resizing
  const handleResize = () => {
    if (typeof window !== "undefined") {
      setPortSize({
        height: window?.innerHeight,
        width: window?.innerWidth,
      });
    }
  };
  //handles window resizing
  useEffect(() => {
    handleResize();
    window?.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      authEndpoint: "/api/pusher/auth",
      auth: {
        params: { username: userName },
      },
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });
    channelRef.current = pusherRef.current.subscribe(
      `presence-${roomName}`
    ) as PresenceChannel;
    // when a users subscribe
    channelRef?.current?.bind(
      "pusher:subscription_succeeded",
      (members: Members) => {
        if (members.count === 1) {
          // when subscribing, if you are the first member, you are the host
          host.current = true;
        }

        // example only supports 2 users per call
        if (members.count > 3) {
          // 3+ person joining will get sent back home
          // Can handle this however you'd like
          router.push("/");
        }
        handleRoomJoined();
      }
    );

    // allows user to exit the room
    //pUsher will call member_removed event
    channelRef?.current?.bind("pusher:member_removed", () => {
      userExit();
    });

    //connection offer by the host to new member joining
    channelRef?.current?.bind(
      "client-offer",
      (offer: RTCSessionDescriptionInit) => {
        // offer is sent by the host, so only non-host should handle it
        if (!host.current) {
          handleReceivedOffer(offer);
        }
      }
    );

    // When the second peer tells host they are ready to start the call
    // This happens after the second peer has grabbed their media
    channelRef.current.bind("client-ready", () => {
      initiateCall();
    });

    //answers offer from host
    channelRef?.current?.bind(
      "client-answer",
      (answer: RTCSessionDescriptionInit) => {
        // answer is sent by non-host, so only host should handle it
        if (host.current) {
          handleAnswerReceived(answer as RTCSessionDescriptionInit);
        }
      }
    );

    channelRef?.current?.bind(
      "client-ice-candidate",
      (iceCandidate: RTCIceCandidate) => {
        // answer is sent by non-host, so only host should handle it
        handlerNewIceCandidateMsg(iceCandidate);
      }
    );

    return () => {
      if (pusherRef.current)
        pusherRef.current.unsubscribe(`presence-${roomName}`);
    };
  }, [userName, roomName, clicked]);

  const handleRoomJoined = () => {
    //get users camera and audio
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: true,
      })
      .then((stream) => {
        /* store reference to the stream and provide it to the video element */
        userStream.current = stream;
        userVideo.current!.srcObject = stream;
        userVideo.current!.onloadedmetadata = () => {
          userVideo.current!.play();
        };
        if (!host.current) {
          // the 2nd peer joining will tell to host they are ready
          channelRef.current!.trigger("client-ready", {});
        }
      })
      .catch((err) => {
        /* handle the error */
        console.log(err);
      });
  };
  //for host to initiate call
  const createPeerConnection = () => {
    // We create a RTC Peer Connection
    const connection = new RTCPeerConnection(ICE_SERVERS);
    // We implement our onicecandidate method for when we received a ICE candidate from the STUN server
    connection.onicecandidate = handleICECandidateEvent;
    // We implement our onTrack method for when we receive tracks
    connection.ontrack = handleTrackEvent;
    connection.onicecandidateerror = (e) => console.log(e);
    return connection;
  };
  //for host to initiate call
  const initiateCall = () => {
    if (host.current) {
      rtcConnection.current = createPeerConnection();
      // Host creates offer
      userStream.current?.getTracks().forEach((track) => {
        rtcConnection.current?.addTrack(track, userStream.current!);
      });
      rtcConnection
        .current!.createOffer()
        .then((offer) => {
          rtcConnection.current!.setLocalDescription(offer);
          // 4. Send offer to other peer via pusher
          // Note: 'client-' prefix means this event is not being sent directly from the client
          // This options needs to be turned on in Pusher app settings
          channelRef.current?.trigger("client-offer", offer);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };
  //for host to handle ice candidate
  const handleReceivedOffer = (offer: RTCSessionDescriptionInit) => {
    rtcConnection.current = createPeerConnection();
    userStream.current?.getTracks().forEach((track) => {
      // Adding tracks to the RTCPeerConnection to give peer access to it
      rtcConnection.current?.addTrack(track, userStream.current!);
    });

    rtcConnection.current.setRemoteDescription(offer);
    rtcConnection.current
      .createAnswer()
      .then((answer) => {
        rtcConnection.current!.setLocalDescription(answer);
        channelRef.current?.trigger("client-answer", answer);
      })
      .catch((error) => {
        console.log(error);
      });
  };
  //for remote user to handle answer
  const handleAnswerReceived = (answer: RTCSessionDescriptionInit) => {
    rtcConnection
      .current!.setRemoteDescription(answer)
      .catch((error) => console.log(error));
  };
  //for host to handle ice candidate
  const handleICECandidateEvent = async (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      // return sentToPusher('ice-candidate', event.candidate)
      channelRef.current?.trigger("client-ice-candidate", event.candidate);
    }
  };
  //for remote user to handle ice candidate
  const handlerNewIceCandidateMsg = (incoming: RTCIceCandidate) => {
    // We cast the incoming candidate to RTCIceCandidate
    const candidate = new RTCIceCandidate(incoming);
    rtcConnection
      .current!.addIceCandidate(candidate)
      .catch((error) => console.log(error));
  };

  //check this to add new video/tracks for multiple users
  const handleTrackEvent = (event: RTCTrackEvent) => {
    if (!partnerVideo?.current?.srcObject) {
      partnerVideo.current!.srcObject = null;
    }
    partnerVideo.current!.srcObject = event.streams[0]!;
  };

  //for local user to handle audio/video toggle
  const switchMediaStream = (type: "video" | "audio", state: boolean) => {
    userStream.current?.getTracks().forEach((track) => {
      if (track.kind === type) {
        track.enabled = !state;
      }
    });
  };
  //for remote user to handle room exit
  const userExit = () => {
    host.current = true;
    if (partnerVideo.current?.srcObject) {
      (partnerVideo.current.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop()); // Stops receiving all track of Peer.
    }

    // Safely closes the existing connection established with the peer who left.
    if (rtcConnection.current) {
      rtcConnection.current.ontrack = null;
      rtcConnection.current.onicecandidate = null;
      rtcConnection.current.close();
      rtcConnection.current = null;
    }
  };
  //for local user to handle room exit
  const exitRoom = () => {
    if (userVideo.current?.srcObject) {
      (userVideo.current?.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop()); // Stops sending all tracks of User.
    }
    if (partnerVideo.current?.srcObject) {
      (partnerVideo.current?.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop()); // Stops receiving all tracks from Peer.
    }

    // Checks if there is peer on the other side and safely closes the existing connection established with the peer.
    if (rtcConnection.current) {
      rtcConnection.current.ontrack = null;
      rtcConnection.current.onicecandidate = null;
      rtcConnection.current.close();
      rtcConnection.current = null;
    }

    router.push("/");
  };
  //turn on/off mic
  const micSwitch = () => {
    switchMediaStream("audio", micActive);
    setMicActive((prev) => !prev);
  };
  //turn on/off camera
  const camSwitch = () => {
    switchMediaStream("video", cameraActive);
    setCameraActive((prev) => !prev);
  };

  const [button, setButton] = useState(false);
  const [hideModal, setHideModal] = useState(true);

  const handleModalClick = () => {
    setHideModal(false);
    setButton(true);
  };
  //for initial modal to activate periphrials and show video/audio
  //needed due to safari mobile browser not initiating video/audio without user interaction
  useEffect(() => {
    setMicActive(true);
    setCameraActive(true);
    partnerVideo?.current?.play();
    userVideo?.current?.play();
  }, [button]);

  return (
    <div className="w-screen h-screen bg-primary flex justify-center items-center overflow-y-clip">
      {hideModal && portSize?.width! < 425 ? (
        <div className="w-screen h-screen absolute z-50 bg-white bg-opacity-60 flex justify-center items-center">
          <button
            onClick={handleModalClick}
            className="bg-green-500 w-24 h-10 rounded-xl shadow-lg hover:bg-green-700"
          >
            Join Call
          </button>
        </div>
      ) : null}
      <div className="bg-secondary w-full h-full flex flex-col items-center overflow-y-clip">
        <div className="sm:w-11/12 w-full sm:h-2/3 h-full flex justify-center items-center sm:mt-5 overflow-y-clip">
          <video
            autoPlay
            playsInline
            ref={partnerVideo}
            className="sm:w-3/4 fixed w-full h-full flex items-start justify-center"
          />
        </div>

        {clicked ? (
          <Modal
            Children={
              <video
                autoPlay
                playsInline
                ref={userVideo}
                muted
                className="w-full sm:w-2/3 h-full"
              />
            }
            setClicked={setClicked}
          />
        ) : (
          <div className="sm:relative sm:bottom-auto bottom-20 fixed w-full h-48 sm:h-1/3 flex justify-end items-center">
            <video
              onClick={() => setClicked(true)}
              autoPlay
              playsInline
              ref={userVideo}
              muted
              className="w-36 sm:w-56 h-full mr-2 sm:mr-5 rounded-lg"
            />
          </div>
        )}
        {/* <video
          onClick={() => setClicked(true)}
          autoPlay
          ref={partnerTwoVideo}
          muted
          className="w-36 sm:w-56 h-full"
        /> */}
        <div className="sm:relative sm:bottom-auto fixed bottom-0 w-full sm:w-96 mt-10 sm:mb-5 sm:h-24 h-16 flex justify-between items-center rounded-lg bg-gray-100 bg-opacity-50">
          <div className="w-1/2 flex justify-around items-center ml-2">
            <button
              className="rounded-xl p-5 mr-2 text-black hover:bg-white hover:bg-opacity-50"
              onClick={micSwitch}
            >
              {micActive ? (
                <IconMicrophoneOff size={25} />
              ) : (
                <IconMicrophone size={25} />
              )}
            </button>
            <button
              className="rounded-xl hover:bg-white hover:bg-opacity-50 p-5 text-black"
              onClick={camSwitch}
            >
              {cameraActive ? (
                <IconCameraOff size={25} />
              ) : (
                <IconCamera size={25} />
              )}
            </button>
          </div>

          <button
            className=" mr-5 text-white bg-red-500 px-7 py-5 rounded-xl hover:bg-red-700"
            onClick={exitRoom}
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
