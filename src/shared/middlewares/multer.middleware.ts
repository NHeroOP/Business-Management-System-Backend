import path from "path";
import multer from "multer";


const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    const fileName = `${file.fieldname}-${uniqueSuffix}${ext}`;
    cb(null, fileName)
  }
})

export const upload = multer({ storage }) 