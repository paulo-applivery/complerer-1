-- Fix the backslash escaping in all email templates
UPDATE email_templates SET body_html = REPLACE(body_html, '<\!DOCTYPE', '<!DOCTYPE') WHERE body_html LIKE '%<\!DOCTYPE%';
