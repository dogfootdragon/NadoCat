import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

//[x]jwt 복호화
export const ensureAutorization = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("미들웨어 시작!!!!");

    //쿠키에서 jwt가져오기
    // const token = req.cookies.generalToken || req.headers["authorization"]?.split(' ')[1];
    const token =  req.headers["authorization"]?.split(" ")[1] || req.cookies.generalToken;
    console.log("cookie token: ", token);
    
    if (!token) {
        return res.status(401).json({ message: 'JWT 토큰이 존재하지 않습니다.' });
    }

      const decodedJwt = jwt.verify(
        token,
        process.env.PRIVATE_KEY_GEN as string
    ) as JwtPayload;

    // JWT 만료 시간 확인
    if (decodedJwt.exp) {
      console.log("JWT 만료 시간:", new Date(decodedJwt.exp * 1000));
    } else {
      console.error("JWT에 만료 시간이 설정되지 않았습니다.");
    }

    // 요청 헤더에서 uuid 가져오기
    const uuid = req.headers["x-uuid"] as string;
    
    req.user = {
        uuid: uuid || decodedJwt.uuid,
        email: decodedJwt.email,
      };

    next();

  } catch (error) {
    console.error("Authorization error:", error);
    if (error instanceof jwt.TokenExpiredError) {
        console.log("TokenExpiredError 발생!");
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({
          message: "로그인 세션이 만료되었습니다. 다시 로그인해주세요.",
        });
    } else if (error instanceof jwt.JsonWebTokenError) {
        console.log("JsonWebTokenError 발생!");
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "잘못된 토큰입니다." });
    }

    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "서버 오류가 발생했습니다." });
  }
};
