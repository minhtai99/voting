import { FieldName } from 'src/files/files.enum';

export const fileFilter = (fieldname: FieldName, mimetype: string): boolean => {
  if (mimetype.match(/\/(jpg|jpeg|png)$/) && fieldname === FieldName.AVATAR) {
    return true;
  }
  return false;
};

export const multerConfig = {
  dest: process.env.UPLOADED_FILES_DESTINATION,
};
