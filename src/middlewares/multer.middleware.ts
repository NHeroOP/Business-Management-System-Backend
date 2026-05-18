import multer from "multer";


const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (_req, file, cb) {
    /*
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9)
      File name will be like this : "originalname-uniqueSuffix.ext"
      Example : "avatar-1634567890123-123456789.jpg"
    */
    cb(null, file.originalname)
  }
})

export const upload = multer({ storage }) 