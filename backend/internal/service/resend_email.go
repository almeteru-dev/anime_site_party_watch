package service

import (
	"errors"
	"fmt"
	"html"
	"log"
	"strings"
	"sync"

	"github.com/resend/resend-go/v3"
	"github.com/seva/animevista/internal/config"
)

const resendFrom = "LycorisLib <noreply@lycorislib.moe>"

var ErrResendNotConfigured = errors.New("RESEND_API_KEY is not set")

var (
	resendMu        sync.Mutex
	resendClient    *resend.Client
	resendClientKey string
)

func getResendClient() (*resend.Client, error) {
	apiKey := strings.TrimSpace(config.AppConfig.RESEND_API_KEY)
	if apiKey == "" {
		return nil, ErrResendNotConfigured
	}

	resendMu.Lock()
	defer resendMu.Unlock()
	if resendClient == nil || resendClientKey != apiKey {
		resendClient = resend.NewClient(apiKey)
		resendClientKey = apiKey
	}
	return resendClient, nil
}

func sendEmail(toEmail string, subject string, htmlBody string) error {
	toEmail = strings.TrimSpace(toEmail)
	if toEmail == "" {
		return errors.New("toEmail is required")
	}
	if strings.TrimSpace(subject) == "" {
		return errors.New("subject is required")
	}
	if strings.TrimSpace(htmlBody) == "" {
		return errors.New("htmlBody is required")
	}

	client, err := getResendClient()
	if err != nil {
		return err
	}

	params := &resend.SendEmailRequest{
		From:    resendFrom,
		To:      []string{toEmail},
		Subject: subject,
		Html:    htmlBody,
	}

	resp, err := client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("send email (subject=%s): %w", subject, err)
	}
	if resp != nil {
		log.Printf("resend: sent email to=%s subject=%q id=%s", toEmail, subject, resp.Id)
	} else {
		log.Printf("resend: sent email to=%s subject=%q", toEmail, subject)
	}
	return nil
}

func SendVerificationEmail(toEmail string, verificationLink string) error {
	toEmail = strings.TrimSpace(toEmail)
	verificationLink = strings.TrimSpace(verificationLink)
	safeLink := html.EscapeString(verificationLink)
	return sendEmail(
		toEmail,
		"Verify your email address",
		fmt.Sprintf("<p>Please click the link below to verify your email address.</p><p><a href=\"%s\">%s</a></p>", safeLink, safeLink),
	)
}

func SendPasswordResetEmail(toEmail string, resetLink string) error {
	resetLink = strings.TrimSpace(resetLink)
	if resetLink == "" {
		return errors.New("resetLink is required")
	}
	safeLink := html.EscapeString(resetLink)
	return sendEmail(
		toEmail,
		"Reset your password",
		fmt.Sprintf("<p>We received a request to reset your password.</p><p><a href=\"%s\">Reset Password</a></p><p>If you didn't request this, you can ignore this email.</p>", safeLink),
	)
}

func SendEmailChangeCode(toEmail string, code string, label string) error {
	code = strings.TrimSpace(code)
	label = strings.TrimSpace(label)
	if code == "" {
		return errors.New("code is required")
	}
	if label == "" {
		label = "email change verification"
	}
	safeCode := html.EscapeString(code)
	safeLabel := html.EscapeString(label)
	return sendEmail(
		toEmail,
		"Your verification code",
		fmt.Sprintf("<p>Your %s code is:</p><p style=\"font-size: 24px; font-weight: 700; letter-spacing: 2px;\">%s</p><p>This code expires soon.</p>", safeLabel, safeCode),
	)
}
