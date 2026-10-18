/* React Spring v9 islands for non-home pages of Acelden.
 * No React ownership over existing navigation/forms/founder interactions:
 * spring controllers operate on the already-existing DOM and unmount on routes.
 */
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { animated, useSpring } from '@react-spring/web';

let activeRoot = null;
let activeHost = null;
const motionQuery = '(prefers-reduced-motion: reduce)';
const clamp = (x, min, max) => Math.max(min, Math.min(max, x));

const selectors = [
  '.about-media',
  '.about-chapter .pill',
  '.about-text-link',
  '.founder-frame',
  '.engine-showcase-art',
  '.projects-roadmap .service',
  '.projects-copy .pill',
  '.services-page .service',
  '.services-outro .pill',
  '.contact-form-motion',
  '.value-grid article',
  '.editorial-art',
  '.page-section .btn',
  '.page-hero .btn',
  '.privacy-end a'
].join(',');

function MotionTarget({ node, draggable }) {
  const legacyReveal = node.classList.contains('reveal');
  const original = React.useRef(null);
  const [springs, api] = useSpring(() => ({
    x: 0, y: 0, lift: 0, tilt: 0, scale: 1, rise: 0, alpha: 1, glint: 0,
    config: { mass: 1, tension: 210, friction: 24, precision: 0.01 },
    onChange: ({ value }) => {
      if (!node.isConnected) return;
      const n = (key, fallback = 0) => Number.isFinite(value[key]) ? value[key] : fallback;
      const translateX = n('x');
      const translateY = n('y') + n('lift') + n('rise');
      node.style.transform = 'translate3d(' + translateX.toFixed(2) + 'px,' +
        translateY.toFixed(2) + 'px,0) rotate(' + n('tilt').toFixed(2) + 'deg) scale(' +
        n('scale', 1).toFixed(4) + ')';
      if (!legacyReveal) node.style.opacity = String(n('alpha', 1));
    }
  }), []);

  useEffect(() => {
    // Capture and restore inline styles, so navigation always returns clean DOM.
    original.current = {
      transform: node.style.transform, opacity: node.style.opacity,
      cursor: node.style.cursor, touchAction: node.style.touchAction
    };
    node.classList.add('acelden-spring-surface');
    if (draggable) node.classList.add('acelden-spring-draggable');
    let drag = null;
    const canHover = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    const reset = () => api.start({
      x: 0, y: 0, lift: 0, tilt: 0, scale: 1, glint: 0,
      config: { mass: 1.1, tension: 250, friction: 23 }
    });
    const enter = () => {
      if (canHover && !drag) api.start({ lift: -7, scale: 1.018, glint: .24 });
    };
    const move = event => {
      if (drag) {
        const dx = clamp(event.clientX - drag.x, -48, 48);
        const dy = clamp(event.clientY - drag.y, -36, 36);
        api.start({ x: dx, y: dy, lift: -4, tilt: dx / 20, scale: 1.035, glint: .35,
          config: { tension: 380, friction: 27 } });
        return;
      }
      if (!canHover) return;
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const relativeX = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
      const relativeY = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
      api.start({ tilt: relativeX * 1.5, x: relativeX * 3,
        y: relativeY * 2, lift: -7, scale: 1.018, glint: .25 });
    };
    const down = event => {
      if (!draggable || (event.pointerType !== 'mouse' && event.pointerType !== 'pen')
        || event.button !== 0 || event.target.closest('a,button,input,textarea,select,[role="button"]')) return;
      drag = { x: event.clientX, y: event.clientY, id: event.pointerId };
      node.classList.add('acelden-spring-grabbing');
      try { node.setPointerCapture(event.pointerId); } catch (_) {}
    };
    const up = event => {
      if (!drag) return;
      try {
        if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
      } catch (_) {}
      drag = null;
      node.classList.remove('acelden-spring-grabbing');
      reset();
    };
    const leave = () => { if (!drag) reset(); };
    const cancelNativeDrag = event => { if (drag) event.preventDefault(); };
    node.addEventListener('pointerenter', enter);
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerleave', leave);
    node.addEventListener('pointerdown', down);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', up);
    node.addEventListener('dragstart', cancelNativeDrag);
    // One-time spring reveal, while preserving existing .reveal behavior.
    const rect = node.getBoundingClientRect();
    const waiting = rect.top > window.innerHeight * .88;
    if (waiting) api.set({ rise: 20, alpha: legacyReveal ? 1 : 0 });
    const observer = 'IntersectionObserver' in window ?
      new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          api.start({ rise: 0, alpha: 1,
            config: { mass: 1.25, tension: 125, friction: 24 } });
          observer.disconnect();
        }
      }, { threshold: .08, rootMargin: '0px 0px -15px 0px' }) : null;
    if (observer) observer.observe(node);
    else api.start({ rise: 0, alpha: 1 });
    return () => {
      observer?.disconnect();
      for (const [event, handler] of [
        ['pointerenter', enter], ['pointermove', move], ['pointerleave', leave],
        ['pointerdown', down], ['pointerup', up], ['pointercancel', up],
        ['dragstart', cancelNativeDrag]
      ]) node.removeEventListener(event, handler);
      api.stop();
      node.classList.remove('acelden-spring-surface', 'acelden-spring-draggable', 'acelden-spring-grabbing');
      if (original.current) {
        for (const [key, value] of Object.entries(original.current)) node.style[key] = value;
      }
    };
  }, [node, api, draggable, legacyReveal]);

  return createPortal(
    React.createElement(animated.span, {
      className: 'acelden-spring-glint',
      'aria-hidden': 'true',
      style: {
        opacity: springs.glint,
        transform: springs.tilt.to(value => 'translate3d(' + (value * 8) + 'px,0,0)')
      }
    }),
    node
  );
}

function SpringLayer({ targets }) {
  return React.createElement(React.Fragment, null,
    targets.map((node, i) => React.createElement(MotionTarget, {
      key: i, node,
      draggable: node.matches('.about-media,.engine-showcase-art,.projects-roadmap .service,.value-grid article,.editorial-art')
    }))
  );
}

export function unmountPageSpring() {
  // Do not unmount during React's render lifecycle.
  if (activeRoot) activeRoot.unmount();
  if (activeHost) activeHost.remove();
  activeRoot = null;
  activeHost = null;
  if (window.__aceldenSpringUnmount === unmountPageSpring) window.__aceldenSpringUnmount = null;
}

export function mountPageSpring() {
  unmountPageSpring();
  const main = document.querySelector('main');
  if (!main || main.classList.contains('studio-home') || matchMedia(motionQuery).matches) return;
  const targets = [...new Set(main.querySelectorAll(selectors))].slice(0, 24);
  if (!targets.length) return;
  activeHost = document.createElement('div');
  activeHost.className = 'acelden-spring-react-root';
  activeHost.hidden = true;
  document.body.appendChild(activeHost);
  activeRoot = createRoot(activeHost);
  activeRoot.render(React.createElement(SpringLayer, { targets }));
  window.__aceldenSpringUnmount = unmountPageSpring;
}
