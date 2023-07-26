import { FieldName } from '../files/files.enum';

export const fileFilter = (fieldname: FieldName, mimetype: string): boolean => {
  if (fieldname === FieldName.AVATAR) {
    if (mimetype.match(/\/(jpg|jpeg|png)$/)) return true;
  }
  if (fieldname === FieldName.BACKGROUND || fieldname === FieldName.PICTURES) {
    if (mimetype.match(/\/(jpg|jpeg|png|tiff|jfif)$/)) return true;
  }
  return false;
};

export const fileConfig = {
  dest: process.env.UPLOADED_FILES_DESTINATION,
  domain: process.env.BACKEND_DOMAIN + '\\',
};
