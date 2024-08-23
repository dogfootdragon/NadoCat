import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
// import crypto from "crypto";
import { createUser, loginUser, saveRefreshToken, kakaoUser, refreshAccessToken } from "../../model/user.model";
import { IUsers, IUserSecrets } from "../../types/user";
// import { Request, Response } from "aws-sdk";


//[x]회원가입
export const signup = async (req: Request, res: Response) => {
  const { email, nickname, password} = req.body;

  //DB저장
  try {
    const result: { user: IUsers, secretUser: IUserSecrets } | null = await createUser(email, nickname, password);

    if(result === null){
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "이미 사용 중인 이메일입니다." });
    }

      return res.status(StatusCodes.CREATED).json({
        message: "회원가입 성공!",
        user: {
          id: result.user.id,
          userId: result.user.uuid,
          email: result.user.email,
          nickname: result.user.nickname,
          authtype: result.user.authType
        },
      });

  } catch (error) {
    console.log("회원가입 error:", error);
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "회원가입 처리 중 오류가 발생했습니다." });
  }
};


//[x]로그인
export const login = async (req: Request, res: Response) => {
  const { email, password, autoLogin } = req.body;
  const isAutoLogin = (autoLogin === 'true' || autoLogin === true);

  try {
    const { generalToken, refreshToken, result, userUuidString } = await loginUser(email, password, autoLogin);
    console.log("autoLogin상태: ", autoLogin);

    if (!userUuidString || (!refreshToken && autoLogin)) {
      console.log("유효하지 않은 UUID 또는 Refresh Token입니다.");
      throw new Error("유효하지 않은 값입니다.");
    }

    res.cookie("generalToken", generalToken, {
      httpOnly: true
    });

    //자동로그인시
    if (isAutoLogin) { 
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 3 * 60 * 1000 //3분
        // maxAge: 7 * 24 * 60 * 60 * 1000 //7일
      });

      //refresh token DB 저장
      await saveRefreshToken(userUuidString, refreshToken as string);
    }

    return res.status(StatusCodes.OK).json({
      message: "로그인 성공",
      user: {
        email: result.selectUser.email,
        nickname: result.selectUser.nickname,
        uuid: userUuidString,
      },
      tokens: {
        accessToken: generalToken,
        refreshToken: refreshToken
      }
    });

  } catch (error) {
    console.log("로그인 error:", error);
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: "로그인 처리 중 오류가 발생했습니다." });
  }
};

//[x] 액세스 토큰 재발급
export const getNewAccessToken = async (req: Request, res: Response) => {
    const {refreshToken} = req.body; //body에 들어오는지 어떻게 아는?

    if(!refreshToken){
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Refresh token이 존재하지 않습니다." });
    }

    try {
        const newAccessToken = await refreshAccessToken(refreshToken);
        return res.status(StatusCodes.OK).json({ accessToken: newAccessToken });

    } catch (error) {
        console.log("로그인 error:", error);
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: "유효하지 않은 Refresh token입니다." });
    }
};

//[ ]카카오
export const kakao = async (req: Request, res: Response) => {
  const { code } = req.query;
  try {
    const tokenResponse = await axios.post(
      process.env.KAKAO_TOKEN_URL as string,
      {},
      {
        params: {
          grant_type: "authorization_code",
          client_id: process.env.KAKAO_REST_API_KEY,
          redirect_uri: process.env.KAKAO_REDIRECT_URI,
          code,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("tokenResponse.data 카카오 데이터: ", tokenResponse.data);
    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    const userResponse = await axios.get(process.env.KAKAO_USERINFO_URL as string, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const { id, properties, kakao_account } = userResponse.data;
    const email = kakao_account.email;
    const nickname = properties.nickname;

    await kakaoUser(email, nickname, access_token, refresh_token, expires_in.toString());

    res.redirect("/signup"); //홈으로 수정

  } catch (error) {
    console.log("카카오 로그인 오류: ", error);
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "카카오 로그인 실패"
    });
  }
};

//::구글
export const google = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  return res.json({ email: email, password: password });
};

