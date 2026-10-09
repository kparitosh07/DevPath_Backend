import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const githubLogin = (req, res) => {
  const githubAuthURL =
    "https://github.com/login/oauth/authorize" +
    `?client_id=${process.env.GITHUB_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(
      process.env.GITHUB_CALLBACK_URL
    )}` +
    `&scope=read:user user:email`;

  res.redirect(githubAuthURL);
};

export const githubCallback = async (req, res) => {
  try {
    const { code } = req.query;

    const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";

    if (!code) {
      return res.redirect(
        `${frontendURL}/?authError=${encodeURIComponent("GitHub authorization code missing")}`
      );
    }

    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.redirect(
        `${frontendURL}/?authError=${encodeURIComponent("Unable to get GitHub access token")}`
      );
    }

    const githubUserResponse = await axios.get(
      "https://api.github.com/user",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    const githubUser = githubUserResponse.data;

    let user = await User.findOne({
      githubId: String(githubUser.id),
    }).select("+githubAccessToken");

    if (!user) {
      user = await User.create({
        githubId: String(githubUser.id),
        username: githubUser.login,
        name: githubUser.name || "",
        email: githubUser.email || "",
        avatar: githubUser.avatar_url || "",
        githubAccessToken: accessToken,
      });
    } else {
      user.username = githubUser.login;
      user.name = githubUser.name || "";
      user.avatar = githubUser.avatar_url || "";
      user.githubAccessToken = accessToken;

      await user.save();
    }

    const token = jwt.sign(
      {
        userId: user._id,
        githubId: user.githubId,
        username: user.username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.redirect(
      `${frontendURL}/?token=${encodeURIComponent(token)}`
    );
  } catch (error) {
    console.error(
      "GitHub OAuth Error:",
      error.response?.data || error.message
    );

    const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";

    return res.redirect(
      `${frontendURL}/?authError=${encodeURIComponent("GitHub authentication failed")}`
    );
  }
};