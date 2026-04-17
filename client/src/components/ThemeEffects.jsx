import { useEffect, useRef } from "react";

function hexToRgb(hex) {
  const normalized = String(hex || "").replace("#", "").trim();

  if (normalized.length !== 6) {
    return { r: 0, g: 255, b: 136 };
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
}

export function ThemeEffects({ accentColor }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const burstsRef = useRef([]);
  const frameRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const soundEnabledRef = useRef(true);
  const effectsEnabledRef = useRef(true);
  const explosionImageRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    const rgb = hexToRgb(accentColor);
    const explosionImage = new Image();
    explosionImage.src = "/images/explosion-effect.png";
    explosionImageRef.current = explosionImage;

    try {
      soundEnabledRef.current = window.localStorage.getItem("donutrain-sound") !== "off";
      effectsEnabledRef.current = window.localStorage.getItem("donutrain-effects") !== "off";
    } catch {
      soundEnabledRef.current = true;
      effectsEnabledRef.current = true;
    }

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createParticles() {
      particlesRef.current = Array.from({ length: 40 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.3 + 0.1,
        alpha: Math.random() * 0.45 + 0.15
      }));
    }

    function spawnBurst(type = "win") {
      if (!effectsEnabledRef.current) {
        return;
      }

      const burstColor =
        type === "loss"
          ? { r: 255, g: 59, b: 59 }
          : type === "big-win"
            ? { r: 250, g: 204, b: 21 }
            : rgb;

      for (let index = 0; index < (type === "big-win" ? 20 : 10); index += 1) {
        burstsRef.current.push({
          x: canvas.width / 2 + (Math.random() - 0.5) * 90,
          y: canvas.height * 0.45 + (Math.random() - 0.5) * 50,
          dx: (Math.random() - 0.5) * (type === "big-win" ? 5 : 3),
          dy: (Math.random() - 0.5) * (type === "big-win" ? 5 : 2.5),
          life: 1,
          size: Math.random() * (type === "loss" ? 24 : 3) + (type === "loss" ? 28 : 1.5),
          color: burstColor,
          type,
          spin: (Math.random() - 0.5) * 0.15,
          angle: Math.random() * Math.PI * 2
        });
      }
    }

    function playExplosionSound() {
      if (!soundEnabledRef.current) {
        return;
      }

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      const audioContext = new AudioContextClass();
      const masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.02);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.42);
      masterGain.connect(audioContext.destination);

      const oscillator = audioContext.createOscillator();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(160, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(38, audioContext.currentTime + 0.4);
      oscillator.connect(masterGain);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.42);

      const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.45, audioContext.sampleRate);
      const channelData = noiseBuffer.getChannelData(0);
      for (let index = 0; index < channelData.length; index += 1) {
        channelData[index] = Math.random() * 2 - 1;
      }

      const noiseSource = audioContext.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      const noiseFilter = audioContext.createBiquadFilter();
      noiseFilter.type = "lowpass";
      noiseFilter.frequency.setValueAtTime(720, audioContext.currentTime);
      const noiseGain = audioContext.createGain();
      noiseGain.gain.setValueAtTime(0.24, audioContext.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.35);
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(audioContext.destination);
      noiseSource.start();
      noiseSource.stop(audioContext.currentTime + 0.35);

      window.setTimeout(() => {
        audioContext.close().catch(() => {});
      }, 650);
    }

    function draw() {
      context.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        particle.y -= particle.speed;
        if (particle.y < -10) {
          particle.y = canvas.height + 10;
          particle.x = Math.random() * canvas.width;
        }

        context.beginPath();
        context.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${particle.alpha})`;
        context.shadowBlur = 18;
        context.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.45)`;
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      });

      burstsRef.current = burstsRef.current.filter((particle) => particle.life > 0.02);
      burstsRef.current.forEach((particle) => {
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.dy += 0.015;
        particle.life *= 0.94;
        particle.size *= particle.type === "loss" ? 0.975 : 0.985;
        particle.angle += particle.spin;

        if (particle.type === "loss" && explosionImageRef.current?.complete) {
          context.save();
          context.globalAlpha = particle.life;
          context.shadowBlur = 18;
          context.shadowColor = `rgba(255, 110, 110, ${particle.life * 0.9})`;
          context.translate(particle.x, particle.y);
          context.rotate(particle.angle);
          context.drawImage(
            explosionImageRef.current,
            -particle.size / 2,
            -particle.size / 2,
            particle.size,
            particle.size
          );
          context.restore();
          return;
        }

        context.beginPath();
        context.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.life})`;
        context.shadowBlur = 16;
        context.shadowColor = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.life * 0.8})`;
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      });

      frameRef.current = window.requestAnimationFrame(draw);
    }

    function handlePointerMove(event) {
      pointerRef.current = {
        x: (event.clientX / window.innerWidth - 0.5) * 10,
        y: (event.clientY / window.innerHeight - 0.5) * 10
      };
      document.documentElement.style.setProperty("--bg-shift-x", `${pointerRef.current.x}px`);
      document.documentElement.style.setProperty("--bg-shift-y", `${pointerRef.current.y}px`);
    }

    function handleSettings(event) {
      soundEnabledRef.current = event.detail?.soundEnabled ?? soundEnabledRef.current;
      effectsEnabledRef.current = event.detail?.effectsEnabled ?? effectsEnabledRef.current;
    }

    function handleGameEffect(event) {
      const type = event.detail?.type || "win";

      if (!effectsEnabledRef.current && type !== "loss") {
        return;
      }

      document.body.classList.remove("win-flash", "lose-flash", "pulse");
      void document.body.offsetWidth;

      if (type === "loss") {
        if (effectsEnabledRef.current) {
          document.body.classList.add("lose-flash", "pulse");
        }
        spawnBurst("loss");
        playExplosionSound();
        window.setTimeout(() => {
          document.body.classList.remove("lose-flash", "pulse");
        }, 220);
        return;
      }

      if (type === "big-win") {
        document.body.classList.add("win-flash", "pulse");
        spawnBurst("big-win");
        window.setTimeout(() => {
          document.body.classList.remove("win-flash", "pulse");
        }, 360);
        return;
      }

      document.body.classList.add("win-flash");
      spawnBurst("win");
      window.setTimeout(() => {
        document.body.classList.remove("win-flash");
      }, 300);
    }

    resize();
    createParticles();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("donutrain:settings", handleSettings);
    window.addEventListener("donutrain:game-effect", handleGameEffect);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("donutrain:settings", handleSettings);
      window.removeEventListener("donutrain:game-effect", handleGameEffect);

      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [accentColor]);

  return <canvas id="particles" ref={canvasRef} />;
}
