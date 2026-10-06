// Пути к аватару: Google avatar или из /assets/icons

export function getAvatarSrc(avatarUrl) {
    if (!avatarUrl) {
        return "./assets/icons/user-icon.png";
    }

    if (
        avatarUrl.startsWith("http://") ||
        avatarUrl.startsWith("https://")
    ) {
        return avatarUrl;
    }

    return `./assets/icons/${avatarUrl}`;
}