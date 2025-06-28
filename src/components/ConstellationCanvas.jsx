// src/components/ConstellationCanvas.jsx
import React, { useRef, useEffect } from "react";

const ConstellationCanvas = () => {
  const canvasRef = useRef(null);
  // Usa uma ref para guardar as partículas para que não sejam recriadas pelo ResizeObserver
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const init = () => {
      // Limpa o array de partículas
      particlesRef.current = [];

      // Usa o tamanho atual do canvas para calcular o número de partículas
      const numParticles = canvas.width > 768 ? 120 : 50;
      for (let i = 0; i < numParticles; i++) {
        particlesRef.current.push(new Particle(canvas));
      }
    };

    class Particle {
      constructor(canvasElement) {
        this.canvas = canvasElement;
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 0.8 - 0.4;
        this.speedY = Math.random() * 0.8 - 0.4;
      }
      update() {
        if (this.x < 0 || this.x > this.canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > this.canvas.height) this.speedY *= -1;
        this.x += this.speedX;
        this.y += this.speedY;
      }
      draw(context) {
        context.fillStyle = "#FBBF24"; // amber-400
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();
      }
    }

    function connect() {
      const connectDistance = canvas.width > 768 ? 150 : 100;
      const particles = particlesRef.current;
      let opacityValue = 1;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectDistance) {
            opacityValue = 1 - distance / connectDistance;
            ctx.strokeStyle = `rgba(251, 191, 36, ${opacityValue})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current.forEach((p) => {
        p.update();
        p.draw(ctx);
      });
      connect();
      animationFrameId = requestAnimationFrame(animate);
    }

    // --- NOVO: Usando ResizeObserver ---
    // Cria um "observador" que reage a mudanças de tamanho do elemento
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Pega as novas dimensões do container
        const { width, height } = entry.contentRect;
        // Atualiza a área de desenho do canvas
        canvas.width = width;
        canvas.height = height;
        // Reinicia as partículas para as novas dimensões
        init();
      }
    });

    // Manda o observador "ficar de olho" no container pai do canvas.
    // O container pai é o <div class="absolute inset-0 z-0">
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    animate();

    // Limpeza: para de observar quando o componente é desmontado
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []); // O array vazio garante que este setup rode apenas uma vez.

  return <canvas ref={canvasRef} className="block" />;
};

export default ConstellationCanvas;
