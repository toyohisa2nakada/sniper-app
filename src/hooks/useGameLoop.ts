import { useEffect, useRef } from 'react';

export const useGameLoop = (callback: (dt: number) => void) => {
    const requestRef = useRef<number>(0);
    const previousTimeRef = useRef<number>(0);

    // 常に最新のcallbackを参照するためのRef
    const callbackRef = useRef(callback);

    // callbackが更新されたらRefも更新（ループを止めずに中身だけ入れ替える）
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const animate = (time: number) => {
        if (previousTimeRef.current !== undefined) {
            const deltaTime = time - previousTimeRef.current;

            // 1秒以上のブランク（タブ移動など）があった場合は計算をスキップ
            // これにより、復帰時に敵が猛スピードで動くのを防ぐ
            if (deltaTime < 1000) {
                callbackRef.current(deltaTime);
            }
        }

        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);

        // コンポーネントが消えるときに確実に停止させる
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, []); // 初回のみ実行
};
