export const ICE_SERVERS = {
  // you can add TURN servers here too
  iceServers: [
    {
      urls: "stun:openrelay.metered.ca:80",
    },
    {
      urls: "stun:stun.l.google.com:19302",
    },
    {
      urls: "stun:stun2.l.google.com:19302",
    },
    // {
    //   urls: "turn:turn.anyfirewall.com:443?transport=tcp",
    //   credential: "webrtc",
    //   username: "webrtc",
    // },
  ],
};
