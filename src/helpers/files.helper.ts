import { FieldName } from 'src/files/files.enum';

export const fileFilter = (fieldname: FieldName, mimetype: string): boolean => {
  if (fieldname === FieldName.AVATAR) {
    if (mimetype.match(/\/(jpg|jpeg|png)$/)) return true;
  }
  if (fieldname === FieldName.BACKGROUND || fieldname === FieldName.PICTURES) {
    if (mimetype.match(/\/(jpg|jpeg|png|tiff|jfif)$/)) return true;
  }
  return false;
};

export const multerConfig = {
  dest: process.env.UPLOADED_FILES_DESTINATION,
};
