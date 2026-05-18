import { User } from "../models/User.model.js";

export const generateUsername = async (
  fullName: string
): Promise<string> => {

  // Normalize base username
  const baseUsername = fullName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  // Escape regex special chars just in case
  const escapedUsername = baseUsername.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  // Find similar usernames
  const existingUsers = await User.find({
    username: {
      $regex: `^${escapedUsername}(\\d+)?$`,
      $options: "i",
    },
  })
    .select("username")
    .lean();

  // Username available
  if (existingUsers.length === 0) {
    return baseUsername;
  }

  let maxSuffix = 0;

  for (const user of existingUsers) {

    const match = user.username.match(
      new RegExp(`^${escapedUsername}(\\d+)$`)
    );

    if (match) {
      const number = Number(match[1]);

      if (number > maxSuffix) {
        maxSuffix = number;
      }
    }

    // Exact base username exists
    if (user.username === baseUsername) {
      maxSuffix = Math.max(maxSuffix, 0);
    }
  }

  return `${baseUsername}${maxSuffix + 1}`;
};