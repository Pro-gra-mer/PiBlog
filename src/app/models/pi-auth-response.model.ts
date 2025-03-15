export interface PiAuthResponse {
  accessToken: string;
  user: {
    uid: string;
    username: string;
  };
}
