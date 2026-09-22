import 'server-only';
import { siteConfig } from '@/config/site';
import { interpolate } from '@/i18n/translate';
import { renderEmail } from '@/server/email';
import { isMailConfigured, sendMail } from '@/server/mailer';
import { TOKEN_TTL_MINUTES } from '@/server/domain/password-reset';
import { firstName } from '@/utils/format';

/**
 * The "forgot password" email, in the language the visitor asked from.
 *
 * The route calls this from `after()`, so sending never delays the response, and every failure
 * is logged rather than thrown — the answer must look the same whether or not the address has
 * an account. Without SMTP configured nothing is sent (and that is logged as a warning: it is
 * the one case where a customer waits for an email that can never arrive).
 */

const EMAILS = {
  en: {
    subject: 'Reset your password',
    text: 'Hi {name}, we received a request to reset the password for your Mattheos Selections account. Choose a new password with the button below — the link works for {minutes} minutes and only once.',
    cta: 'Choose a new password',
    footer:
      'You receive this email because a password reset was requested at Mattheos Selections. If it was not you, simply ignore this email — your current password stays valid.',
  },
  sv: {
    subject: 'Återställ ditt lösenord',
    text: 'Hej {name}, vi har fått en begäran om att återställa lösenordet till ditt konto hos Mattheos Selections. Välj ett nytt lösenord med knappen nedan — länken gäller i {minutes} minuter och kan bara användas en gång.',
    cta: 'Välj ett nytt lösenord',
    footer:
      'Du får det här mejlet eftersom någon begärt ett nytt lösenord hos Mattheos Selections. Var det inte du kan du bortse från mejlet — ditt nuvarande lösenord fortsätter att gälla.',
  },
  el: {
    subject: 'Επαναφορά του κωδικού πρόσβασής σας',
    text: 'Γεια σας {name}, λάβαμε αίτημα επαναφοράς του κωδικού πρόσβασης για τον λογαριασμό σας στη Mattheos Selections. Επιλέξτε νέο κωδικό με το κουμπί παρακάτω — ο σύνδεσμος ισχύει για {minutes} λεπτά και μόνο μία φορά.',
    cta: 'Επιλέξτε νέο κωδικό',
    footer:
      'Λαμβάνετε αυτό το email επειδή ζητήθηκε επαναφορά κωδικού στη Mattheos Selections. Αν δεν ήσασταν εσείς, αγνοήστε το — ο τρέχων κωδικός σας παραμένει σε ισχύ.',
  },
};

/**
 * Email one reset link to `user`. `token` is the raw token from createPasswordReset —
 * it exists only in this email. Returns whether an email went out; never throws.
 */
export async function sendPasswordResetEmail({ user, token, locale = 'en' }, { origin } = {}) {
  if (!user?.email) return false;
  if (!isMailConfigured()) {
    console.warn('[password-emails] SMTP_HOST is not set — no reset link was sent to', user.email);
    return false;
  }

  const language = EMAILS[locale] ? locale : 'en';
  const copy = EMAILS[language];

  try {
    await sendMail(
      renderEmail({
        to: user.email,
        subject: copy.subject,
        text: interpolate(copy.text, {
          name: firstName(user.name) || user.name,
          minutes: TOKEN_TTL_MINUTES,
        }),
        link: `${origin || siteConfig.url}/${language}/reset-password?token=${encodeURIComponent(token)}`,
        cta: copy.cta,
        footer: copy.footer,
      })
    );
    return true;
  } catch (error) {
    console.error(`[password-emails] reset link for ${user.email} failed:`, error.message);
    return false;
  }
}
