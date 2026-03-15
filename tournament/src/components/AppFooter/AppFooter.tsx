import { useI18n } from '../../i18n/i18n'
import { useTheme } from '../../theme/theme'

export const AppFooter = () => {
  const { t, toggleLanguage } = useI18n()
  const { theme, toggleTheme } = useTheme()

  return (
    <footer className="footer">
      <div className="footer-controls">
        <span className="footer-control">
          <span className="footer-label">lang:</span>
          <button
            type="button"
            className="secondary footer-mini-button"
            onClick={toggleLanguage}
          >
            {t('header.toggleLanguage')}
          </button>
        </span>
        <span className="footer-control">
          <span className="footer-label">theme:</span>
          <button
            type="button"
            className="secondary footer-mini-button"
            onClick={toggleTheme}
          >
            {theme === 'dark'
              ? t('header.toggleThemeToLight')
              : t('header.toggleThemeToDark')}
          </button>
        </span>
      </div>
      <p className="footnote">{t('footer.note')}</p>
    </footer>
  )
}
