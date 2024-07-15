import apps from "@/app/api/utilities/apps/apps.json";

export default async function getAppInfo(id) {
  const appInfo = apps[id];
  if (!appInfo) {
    throw new Error(`App with id ${id} not found`);
  }
  return {
    ...appInfo,
    id,
    secret: process.env[`APP_SECRET_${appInfo.alias}`],
  };
}

export async function getAppList() {
  // Not being used yet! Delete comment when it is being used.

  return Object.entries(apps).map(([id, appInfo]) => ({
    ...appInfo,
    id,
  }));
}
