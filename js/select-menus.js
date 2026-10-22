// Mantém as listas no mesmo sistema de coordenadas do dashboard incorporado.
(() => {
    const menu = document.createElement('div');
    menu.className = 'menu-select-dashboard';
    menu.setAttribute('popover', 'auto');
    menu.setAttribute('role', 'listbox');
    let ativo = null;
    function fechar() { if (menu.matches(':popover-open')) menu.hidePopover(); }
    function posicionar() {
        if (!ativo) return;
        const r = ativo.getBoundingClientRect();
        if (!r.width || !r.height) { fechar(); return; }
        menu.style.width = Math.min(r.width, innerWidth - 16) + 'px';
        menu.style.left = Math.max(8, Math.min(r.left, innerWidth - r.width - 8)) + 'px';
        const abaixo = innerHeight - r.bottom - 8;
        const acima = r.top - 8;
        const altura = Math.min(menu.scrollHeight, 280);
        const subir = abaixo < altura && acima > abaixo;
        menu.style.maxHeight = Math.max(0, Math.min(280, subir ? acima : abaixo)) + 'px';
        menu.style.top = (subir ? Math.max(8, r.top - altura - 2) : r.bottom + 2) + 'px';
    }
    function abrir(select) {
        if (select.disabled || select.multiple) return;
        fechar(); ativo = select; menu.replaceChildren();
        menu.setAttribute('aria-label', select.labels?.[0]?.textContent.trim() || 'Opções');
        [...select.options].forEach((option, index) => {
            if (option.hidden) return;
            const item = document.createElement('button');
            item.type = 'button'; item.textContent = option.textContent.trim();
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', String(option.selected));
            item.disabled = option.disabled || option.parentElement.disabled === true;
            item.addEventListener('click', () => {
                const mudou = select.selectedIndex !== index;
                select.selectedIndex = index;
                fechar(); select.focus();
                if (mudou) {
                    select.dispatchEvent(new Event('input', {bubbles:true}));
                    select.dispatchEvent(new Event('change', {bubbles:true}));
                }
            });
            menu.appendChild(item);
        });
        menu.showPopover(); posicionar();
        const escolhido = menu.querySelector('[aria-selected="true"]:not(:disabled)') || menu.querySelector('button:not(:disabled)');
        escolhido?.focus({preventScroll:true});
        escolhido?.scrollIntoView({block:'nearest'});
    }
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(menu));
    document.addEventListener('mousedown', event => {
        if (event.button !== 0 || event.target.tagName !== 'SELECT' || event.target.multiple) return;
        event.preventDefault(); abrir(event.target);
    });
    document.addEventListener('keydown', event => {
        if (event.target.tagName === 'SELECT' && ['ArrowDown','ArrowUp','Enter',' '].includes(event.key)) {
            event.preventDefault(); abrir(event.target); return;
        }
        if (!menu.contains(event.target)) return;
        const items = [...menu.querySelectorAll('button:not(:disabled)')];
        const index = items.indexOf(document.activeElement);
        if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
            event.preventDefault();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
            items[next]?.focus();
        } else if (event.key === 'Escape' || event.key === 'Tab') {
            fechar(); ativo?.focus();
            if (event.key === 'Escape') event.preventDefault();
        }
    });
    window.addEventListener('resize', () => { if(menu.matches(':popover-open')) posicionar(); });
    document.addEventListener('scroll', event => {
        if(menu.matches(':popover-open') && !menu.contains(event.target)) posicionar();
    }, true);
})();
