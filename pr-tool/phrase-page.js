document.addEventListener("click", async event => {
    const copyButton = event.target.closest("[data-copy]");
    const shareButton = event.target.closest("[data-share]");
    const card = event.target.closest("[data-phrase]");

    if (!card || (!copyButton && !shareButton)) {
        return;
    }

    const text = card.dataset.phrase || card.querySelector(".phrase-text")?.textContent || "";

    if (copyButton) {
        await copyText(text);
        const previous = copyButton.textContent;
        copyButton.textContent = "Copiado";
        setTimeout(() => {
            copyButton.textContent = previous;
        }, 1100);
        return;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
});

async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
}
