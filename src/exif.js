// 读取图片 EXIF 摘要（相机、日期、GPS 定位）；无 EXIF 时返回 null
const PICK = ['Make', 'Model', 'DateTimeOriginal'];

export async function readExif(file) {
  try {
    const { default: exifr } = await import('exifr');
    const [data, gps] = await Promise.all([exifr.parse(file, PICK), exifr.gps(file)]);
    if (!data && !gps) return null;
    return {
      make: (data && data.Make) || '',
      model: (data && data.Model) || '',
      date: (data && data.DateTimeOriginal) || '',
      hasGps: Boolean(gps && gps.latitude != null && gps.longitude != null),
    };
  } catch {
    return null;
  }
}
