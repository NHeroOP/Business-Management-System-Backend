import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User.model.js";
import { generateUsername } from "../utils/usernameGen.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("No email found"));
        }

        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email }],
        });

        if (user && !user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }

        const username = await generateUsername(profile.displayName);
        if (!user) {
          user = await User.create({
            username,
            fullName: profile.displayName,
            email,
            googleId: profile.id,
            avatarUrl: profile.photos?.[0]?.value || "",
          });
        }

        user = await User.findById(user._id).select("-password -refreshToken -googleId");
        if (!user) {
          return done(new Error("User not found after creation"));
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    },
  ),
);

export default passport;
