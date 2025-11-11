'use client';

import { usePwaInstall } from '../hooks/usePwaInstall';

type Props = {
  label: string;         // ป้ายบนปุ่ม เช่น "ติดตั้งแอป"
  className?: string;    // กรณีอยากส่งคลาสเพิ่ม
};

export default function InstallPWA({ label, className }: Props) {
  const { canInstall, requestInstall, showIOSHelp, closeIOSHelp, isIOS } = usePwaInstall();

  if (!canInstall) return null;

  return (
    <>
      <button
        onClick={requestInstall}
        className={
          className ??
          'mt-4 inline-flex items-center rounded-lg bg-white px-6 py-3 text-lg text-slate-700 font-semibold'
        }
        aria-label={label}
      >
        {label}
      </button>

      {/* iOS helper sheet */}
      {showIOSHelp && isIOS && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-xl font-semibold">เพิ่มลงบนหน้าจอโฮม (iOS)</h2>
            <ol className="mt-3 space-y-2 text-gray-700 list-decimal list-inside">
              <li>แตะไอคอน <span className="font-semibold">Share</span> ใน Safari</li>
              <li>เลื่อนลงและเลือก <span className="font-semibold">Add to Home Screen</span></li>
              <li>กด <span className="font-semibold">Add</span> เพื่อยืนยัน</li>
            </ol>
            <button
              onClick={closeIOSHelp}
              className="mt-4 w-full rounded-lg bg-gray-900 text-white py-2.5 font-medium"
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}
    </>
  );
}
