const DEFAULT_VISIBLE_OFFSET = 360;

/**
 * Инициализирует кнопку возврата наверх и её видимость при прокрутке.
 *
 * @param scrollTopButton Кнопка прокрутки к началу страницы.
 */
export function createScrollTopController(scrollTopButton: HTMLButtonElement): void {
  /**
   * Показывает или скрывает кнопку в зависимости от текущей прокрутки.
   */
  function updateVisibility(): void {
    const isVisible = window.scrollY > DEFAULT_VISIBLE_OFFSET;
    scrollTopButton.classList.toggle('scroll-top-visible', isVisible);
  }

  /**
   * Плавно прокручивает страницу к началу.
   */
  function scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  scrollTopButton.addEventListener('click', () => {
    scrollToTop();
  });

  window.addEventListener('scroll', updateVisibility, { passive: true });
  updateVisibility();
}
