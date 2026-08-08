// ============================================================
// Mistella - バンドル済みデモアバター
// 実在人物の写真をサンプルプロフィールへ流用しないため、
// AI生成した架空の日本人女性ポートレートをアプリに同梱する。
// ============================================================

import type { ImageSourcePropType } from 'react-native';

const DEMO_AVATARS: Record<string, ImageSourcePropType> = {
  'mistella-demo://cast/01': require('../../assets/images/demo/cast/01.jpg'),
  'mistella-demo://cast/02': require('../../assets/images/demo/cast/02.jpg'),
  'mistella-demo://cast/03': require('../../assets/images/demo/cast/03.jpg'),
  'mistella-demo://cast/04': require('../../assets/images/demo/cast/04.jpg'),
  'mistella-demo://cast/05': require('../../assets/images/demo/cast/05.jpg'),
  'mistella-demo://cast/06': require('../../assets/images/demo/cast/06.jpg'),
  'mistella-demo://cast/07': require('../../assets/images/demo/cast/07.jpg'),
  'mistella-demo://cast/08': require('../../assets/images/demo/cast/08.jpg'),
  'mistella-demo://cast/09': require('../../assets/images/demo/cast/09.jpg'),
  'mistella-demo://cast/10': require('../../assets/images/demo/cast/10.jpg'),
  'mistella-demo://cast/11': require('../../assets/images/demo/cast/11.jpg'),
  'mistella-demo://cast/12': require('../../assets/images/demo/cast/12.jpg'),
  'mistella-demo://cast/13': require('../../assets/images/demo/cast/13.jpg'),
  'mistella-demo://cast/14': require('../../assets/images/demo/cast/14.jpg'),
  'mistella-demo://cast/15': require('../../assets/images/demo/cast/15.jpg'),
  'mistella-demo://cast/16': require('../../assets/images/demo/cast/16.jpg'),
  'mistella-demo://cast/17': require('../../assets/images/demo/cast/17.jpg'),
  'mistella-demo://cast/18': require('../../assets/images/demo/cast/18.jpg'),
  'mistella-demo://cast/19': require('../../assets/images/demo/cast/19.jpg'),
  'mistella-demo://cast/20': require('../../assets/images/demo/cast/20.jpg'),
  'mistella-demo://cast/21': require('../../assets/images/demo/cast/21.jpg'),
  'mistella-demo://cast/22': require('../../assets/images/demo/cast/22.jpg'),
  'mistella-demo://cast/23': require('../../assets/images/demo/cast/23.jpg'),
  'mistella-demo://cast/24': require('../../assets/images/demo/cast/24.jpg'),
  'mistella-demo://cast/25': require('../../assets/images/demo/cast/25.jpg'),
  'mistella-demo://cast/26': require('../../assets/images/demo/cast/26.jpg'),
  'mistella-demo://cast/27': require('../../assets/images/demo/cast/27.jpg'),
  'mistella-demo://cast/28': require('../../assets/images/demo/cast/28.jpg'),
  'mistella-demo://cast/29': require('../../assets/images/demo/cast/29.jpg'),
  'mistella-demo://cast/30': require('../../assets/images/demo/cast/30.jpg'),
};

/** 通常URLとデモ専用URIを、React Native Image が読める source に変換する。 */
export function avatarSource(uri: string): ImageSourcePropType {
  return DEMO_AVATARS[uri] ?? { uri };
}
