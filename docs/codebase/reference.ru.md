# Справочник кодовой базы (Авто-генерация)

Этот файл сгенерирован автоматически. Он перечисляет исходники и найденные функции/компоненты. Подробные описания дописываются отдельно по мере готовности.

## GO
### Файл: `backend/cmd/api/main.go`
- Символы: `main`
### Файл: `backend/internal/app/db.go`
- Символы: `InitDB`, `dropAllTables`, `runSQLMigrations`
### Файл: `backend/internal/app/ent.go`
- Символы: `InitEnt`, `PostgresDSN`
### Файл: `backend/internal/app/seed.go`
- Символы: `Seed`
### Файл: `backend/internal/config/config.go`
- Символы: `CookieSameSite`, `CookieSecure`, `LoadConfig`, `getEnv`, `getEnvAsBool`, `splitCSV`, `uniqueNonEmpty`
### Файл: `backend/internal/handlers/admin.go`
- Символы: `AdminCreateAnime`, `AdminDeleteAnime`, `AdminGetMeta`, `AdminUpdateAnime`, `derefStrSlice`, `parseOptionalDate`, `slugify`
### Файл: `backend/internal/handlers/admin_achievements.go`
- Символы: `AdminAssignAchievementToUser`, `AdminBulkAssignAchievementByRegisteredBefore`, `AdminBulkAssignAchievementByRole`, `AdminBulkUnassignAchievementByRole`, `AdminCreateAchievement`, `AdminDeleteAchievement`, `AdminGetUserAchievements`, `AdminListAchievements`, `AdminUnassignAchievementFromUser`, `AdminUpdateAchievement`, `parseInt64Param`
### Файл: `backend/internal/handlers/admin_anime_sync.go`
- Символы: `AdminAnimeSyncSchedule`, `AdminAnimeSyncStatus`, `SyncScheduleFromJikanAndShikimori`, `SyncScheduleFromShikimoriCalendar`, `absShikiURL`, `buildAltTitles`, `derefStr`, `ensureGenre`, `ensureKindOption`, `ensureProducer`, `ensureRatingOption`, `ensureSource`, `ensureStatus`, `ensureStudio`, `ensureTheme`, `getRootAdminTimezone`, `isShikiMissingImage`, `normalizeShikiRating`, `ptrInt`, `regexpReplaceAllString`, `stripShikiBBCode`, `toJSON`, `uniqueAnimeURL`, `uniqueInts`, `upsertAnimeFromShiki`, `upsertAnimeTranslation`, `upsertSchedule`, `upsertScheduleFutureOnly`
### Файл: `backend/internal/handlers/admin_email.go`
- Символы: `AdminTestVerificationEmail`
### Файл: `backend/internal/handlers/admin_faq.go`
- Символы: `AdminCreateFAQ`, `AdminDeleteFAQ`, `AdminListFAQ`, `AdminUpdateFAQ`
### Файл: `backend/internal/handlers/admin_mal_top.go`
- Символы: `AdminDeleteMALTopAnime`, `AdminGetMALTopAnime`, `AdminUpsertMALTopAnime`
### Файл: `backend/internal/handlers/admin_root.go`
- Символы: `AdminTransferRoot`
### Файл: `backend/internal/handlers/admin_schedule_animes.go`
- Символы: `AdminListOngoingAnimes`
### Файл: `backend/internal/handlers/admin_settings.go`
- Символы: `AdminSetDefaultPassword`, `AdminSetPrivateMode`, `AdminSetRegistrationDisabled`, `AdminSetScheduleTimezone`, `GetPublicSettings`, `getDefaultPassword`, `getScheduleTimezone`, `isAllowedScheduleTimezone`, `isRegistrationDisabled`, `loadScheduleLocation`, `mustScheduleLocation`, `normalizeScheduleTimezoneValue`, `recalcScheduleUTC`
### Файл: `backend/internal/handlers/admin_settings_test.go`
- Символы: `TestLoadScheduleLocation`, `TestRecalcScheduleUTC_PreservesLocalClock`
### Файл: `backend/internal/handlers/admin_titles.go`
- Символы: `AdminAssignTitleToUser`, `AdminBulkAssignTitleByRegisteredBefore`, `AdminBulkAssignTitleByRole`, `AdminBulkUnassignTitleByRole`, `AdminCreateTitle`, `AdminDeleteTitle`, `AdminGetUserTitles`, `AdminListTitles`, `AdminUnassignTitleFromUser`, `AdminUpdateTitle`, `parseInt64Param2`
### Файл: `backend/internal/handlers/admin_users.go`
- Символы: `AdminBanUser`, `AdminCreateUser`, `AdminDeleteUser`, `AdminGetUser`, `AdminGetUserProfileByUsername`, `AdminListUsers`, `AdminResetUserPasswordDefault`, `AdminUnbanUser`, `AdminUpdateUser`, `adminRoleLevel`, `canActOnTarget`, `canAssignRole`
### Файл: `backend/internal/handlers/anime.go`
- Символы: `GetAnimeByID`, `GetAnimes`, `splitCSVParam`
### Файл: `backend/internal/handlers/anime_alt_titles_util.go`
- Символы: `normalizeAltTitles`, `replaceAnimeAltTitlesTx`
### Файл: `backend/internal/handlers/anime_gallery_util.go`
- Символы: `isValidHTTPURL`, `normalizeGalleryURLs`, `replaceAnimeGalleryImagesTx`
### Файл: `backend/internal/handlers/anime_genres.go`
- Символы: `AdminSetAnimeGenres`
### Файл: `backend/internal/handlers/anime_genres_util.go`
- Символы: `setAnimeGenres`, `setAnimeGenresTx`
### Файл: `backend/internal/handlers/anime_producers_util.go`
- Символы: `setAnimeProducers`, `setAnimeProducersTx`
### Файл: `backend/internal/handlers/anime_random.go`
- Символы: `GetRandomAnime`
### Файл: `backend/internal/handlers/anime_seasons.go`
- Символы: `buildSeasonsForAnime`, `validateAnimeSeasonFields`
### Файл: `backend/internal/handlers/anime_themes.go`
- Символы: `AdminSetAnimeThemes`, `setAnimeThemes`, `setAnimeThemesTx`
### Файл: `backend/internal/handlers/auth.go`
- Символы: `ForgotPassword`, `Login`, `Logout`, `Register`, `ResendVerification`, `ResetPassword`, `VerifyEmail`, `generateToken`, `publicWebBaseURL`
### Файл: `backend/internal/handlers/collection.go`
- Символы: `AddToMyCollection`, `GetMyCollections`, `GetUserCollection`, `RemoveFromCollection`, `RemoveFromMyCollection`, `UpdateCollectionEntry`
### Файл: `backend/internal/handlers/collection_episodes_watched.go`
- Символы: `UpdateMyCollectionEpisodesWatched`
### Файл: `backend/internal/handlers/collection_import_export.go`
- Символы: `ClearMyCollections`, `ExportCollectionsToShikimoriJSON`, `ImportCollectionsFromJSON`
### Файл: `backend/internal/handlers/episode.go`
- Символы: `AdminCreateEpisode`, `AdminCreateVideoSource`, `AdminDeleteEpisode`, `AdminDeleteVideoSource`, `AdminSetDefaultVideoSource`, `AdminUpdateEpisode`, `AdminUpdateVideoSource`, `GetAnimeEpisodes`, `getOrCreateVideoLabelByName`, `mapEpisodeDBError`
### Файл: `backend/internal/handlers/faq_public.go`
- Символы: `GetPublicFAQ`, `pickFAQText`
### Файл: `backend/internal/handlers/featured_anime.go`
- Символы: `AdminListFeaturedAnimes`, `AdminSetAnimeFeatured`, `GetFeaturedAnimes`
### Файл: `backend/internal/handlers/footer_settings.go`
- Символы: `AdminSetFooterLinks`, `getFooterContactURL`, `getFooterSocialLinks`, `isValidFooterURL`
### Файл: `backend/internal/handlers/jikan.go`
- Символы: `AdminJikanGetAnime`
### Файл: `backend/internal/handlers/kind_rating.go`
- Символы: `AdminCreateKind`, `AdminCreateRating`, `AdminDeleteKind`, `AdminDeleteRating`, `AdminListKinds`, `AdminListRatings`, `AdminUpdateKind`, `AdminUpdateRating`
### Файл: `backend/internal/handlers/kodik_bulk.go`
- Символы: `AdminKodikBulkStart`, `AdminKodikBulkStatus`, `runKodikBulk`
### Файл: `backend/internal/handlers/kodik_import.go`
- Символы: `AdminKodikImportEpisodes`, `ensureVideoLabelTx`, `ensureVoiceGroupTx`, `kodikImportEpisodesForAnime`, `kodikSearchByShikimoriID`
### Файл: `backend/internal/handlers/kodik_settings.go`
- Символы: `AdminSetKodikPlayerSettings`, `boolToString`, `getBoolSetting`, `getKodikGeoblock`, `getKodikHideSelectors`, `getKodikSkipEnabled`, `getKodikSkipValue`, `getSettingValue`, `normalizeCountryList`
### Файл: `backend/internal/handlers/mal_oauth.go`
- Символы: `AdminMALOAuthCallback`, `AdminMALOAuthStart`, `AdminMALRefreshTokens`, `AdminMALRevokeTokens`, `AdminMALTokenStatus`, `exchangeMALToken`, `pkceChallenge`, `randBase64URL`, `refreshMALAccessToken`
### Файл: `backend/internal/handlers/mal_proxy.go`
- Символы: `PublicMALAnimeDetails`, `PublicMALAnimeSearch`
### Файл: `backend/internal/handlers/mal_top.go`
- Символы: `AdminSyncMALTopAnime`, `GetMALTopAnime`, `GetMALTopAnimeCatalog`
### Файл: `backend/internal/handlers/mal_top_hydrate.go`
- Символы: `SyncMALTopAnimeAndHydrate`, `mapJikanRatingToInternal`, `mapJikanSourceToInternal`, `mapJikanStatusToInternal`, `mapJikanTypeToKind`, `parseJikanAiredDate`, `pickJikanPoster`, `upsertAnimeFromJikan`
### Файл: `backend/internal/handlers/meta.go`
- Символы: `GetPublicCatalogMeta`
### Файл: `backend/internal/handlers/moonanime_anime.go`
- Символы: `AdminMoonanimeGetAnime`, `moonanimeGetAnimeRaw`
### Файл: `backend/internal/handlers/moonanime_bulk.go`
- Символы: `AdminMoonanimeBulkStart`, `AdminMoonanimeBulkStatus`, `runMoonanimeBulk`
### Файл: `backend/internal/handlers/moonanime_import.go`
- Символы: `AdminMoonanimeImportEpisodes`, `fetchMoonanimeRecentEpisodesAll`, `fetchMoonanimeRecentEpisodesAllWith`, `fetchMoonanimeRecentEpisodesPageWith`, `moonanimeEntryKey`, `moonanimeImportEpisodesForAnime`
### Файл: `backend/internal/handlers/moonanime_import_test.go`
- Символы: `TestFetchMoonanimeRecentEpisodesAllWith_PaginatesToWantedCount`
### Файл: `backend/internal/handlers/providers_aggregate.go`
- Символы: `fetchShikiAnimeWithJikanEnrichment`
### Файл: `backend/internal/handlers/providers_mal_jikan.go`
- Символы: `doMALGet`, `fetchJikanAnimeFull`, `fetchJikanEnrichment`, `getMALAccessToken`, `jikanGetAnimeRaw`
### Файл: `backend/internal/handlers/providers_shikimori.go`
- Символы: `fetchShikimoriCalendar`, `shikimoriFetchUserRates`, `shikimoriGetAnimeByID`, `shikimoriGetAnimeRaw`, `shikimoriGetUserByUsername`, `shikimoriSearchAnimeList`
### Файл: `backend/internal/handlers/rating.go`
- Символы: `GetAnimeAverageRating`, `GetMyAnimeRating`, `RateAnime`, `userIDFromContext`
### Файл: `backend/internal/handlers/rating_test.go`
- Символы: `TestUserIDFromContext`
### Файл: `backend/internal/handlers/reference_lists.go`
- Символы: `AdminCreateGenre`, `AdminCreateProducer`, `AdminCreateSource`, `AdminCreateStatus`, `AdminCreateStudio`, `AdminCreateTheme`, `AdminCreateVideoLabel`, `AdminDeleteGenre`, `AdminDeleteProducer`, `AdminDeleteSource`, `AdminDeleteStatus`, `AdminDeleteStudio`, `AdminDeleteTheme`, `AdminDeleteVideoLabel`, `AdminListGenres`, `AdminListProducers`, `AdminListSources`, `AdminListStatuses`, `AdminListStudios`, `AdminListThemes`, `AdminListVideoLabels`, `AdminTranslateThemesFromShikimori`, `AdminUpdateGenre`, `AdminUpdateProducer`, `AdminUpdateSource`, `AdminUpdateStatus`, `AdminUpdateStudio`, `AdminUpdateTheme`, `AdminUpdateVideoLabel`, `mapDeleteRefError`
### Файл: `backend/internal/handlers/ru_names.go`
- Символы: `applyGenreRU`, `applySourceRU`, `applyStatusRU`, `applyStudioRU`, `applyThemeRU`, `getRuLanguageID`, `hydrateAnimeRefsRU`, `normalizeOptionalName`, `setGenreRUName`, `setSourceRUName`, `setStatusRUName`, `setStudioRUName`, `setThemeRUName`
### Файл: `backend/internal/handlers/rules.go`
- Символы: `AdminCreateRule`, `AdminDeleteRule`, `AdminUpdateRule`, `ListRules`, `normalizeRuleInput`, `validateRuleText`
### Файл: `backend/internal/handlers/schedule.go`
- Символы: `AdminCreateSchedule`, `AdminDeleteSchedule`, `AdminListSchedule`, `AdminPurgeOldSchedules`, `AdminUpdateSchedule`, `GetSchedule`, `getAnimeTitleByCode`, `isUniqueViolation`, `mapScheduleItem`, `parseScheduleRange`, `queryScheduleRange`
### Файл: `backend/internal/handlers/search.go`
- Символы: `SearchAnimes`
### Файл: `backend/internal/handlers/shikimori.go`
- Символы: `AdminShikimoriGetAnime`, `AdminShikimoriSearch`
### Файл: `backend/internal/handlers/shikimori_import.go`
- Символы: `ImportShikimoriCollections`, `ensureAnimeByShikimoriID`, `upsertAnimeRating`
### Файл: `backend/internal/handlers/uk_names.go`
- Символы: `applyGenreUK`, `applySourceUK`, `applyStatusUK`, `applyStudioUK`, `applyThemeUK`, `getUkLanguageID`, `hydrateAnimeRefsUK`, `setGenreUKName`, `setSourceUKName`, `setStatusUKName`, `setStudioUKName`, `setThemeUKName`
### Файл: `backend/internal/handlers/user.go`
- Символы: `GetMe`, `GetProfile`, `RequestNewEmailCode`, `RequestOldEmailCode`, `UpdateAge`, `UpdatePassword`, `UpdateUsername`, `VerifyNewEmailCode`, `VerifyOldEmailCode`, `generateCode`
### Файл: `backend/internal/handlers/voice_group.go`
- Символы: `AdminCreateVoiceGroup`, `AdminDeleteVoiceGroup`, `AdminListVoiceGroups`, `AdminUpdateVoiceGroup`
### Файл: `backend/internal/handlers/watch_party_admin.go`
- Символы: `AdminPurgeOfflineRooms`
### Файл: `backend/internal/handlers/watch_party_hub.go`
- Символы: `ActiveRoomIDs`, `AddChatMessage`, `AddUserToRoom`, `Broadcast`, `BroadcastExcept`, `DissolveRoom`, `GetChatSnapshot`, `GetRoomStateSnapshot`, `NewWatchPartyHub`, `RemoveUserFromRoom`, `SetOwnerAdPlaying`, `TransferOwnership`, `UpdateOwnerTime`, `UpdateRoomEpisode`, `UpdateRoomPlaying`, `cleanupRoom`, `sendToClients`, `sendToConn`, `sendUsersUpdate`, `snapshotUsersLocked`, `startJanitor`
### Файл: `backend/internal/handlers/watch_party_ws.go`
- Символы: `CreateRoom`, `GetRoom`, `RoomWS`
### Файл: `backend/internal/handlers/watch_progress.go`
- Символы: `GetMyAnimeWatchProgress`, `UpsertMyAnimeWatchProgress`
### Файл: `backend/internal/middleware/auth.go`
- Символы: `AdminOnly`, `AuthMiddleware`, `DenyModeratorDelete`, `RequireMinRole`, `RootOnly`, `roleLevel`
### Файл: `backend/internal/middleware/import_rate_limit.go`
- Символы: `ShikiImportRateLimit`
### Файл: `backend/internal/models/achievement.go`
- Символы: (none detected)
### Файл: `backend/internal/models/anime.go`
- Символы: `TableName`
### Файл: `backend/internal/models/anime_alt_title.go`
- Символы: `TableName`
### Файл: `backend/internal/models/anime_gallery_image.go`
- Символы: `TableName`
### Файл: `backend/internal/models/app_setting.go`
- Символы: (none detected)
### Файл: `backend/internal/models/episode.go`
- Символы: (none detected)
### Файл: `backend/internal/models/faq.go`
- Символы: `TableName`
### Файл: `backend/internal/models/kind_option.go`
- Символы: `TableName`
### Файл: `backend/internal/models/rating_option.go`
- Символы: `TableName`
### Файл: `backend/internal/models/reference.go`
- Символы: (none detected)
### Файл: `backend/internal/models/rule.go`
- Символы: (none detected)
### Файл: `backend/internal/models/schedule_item.go`
- Символы: `TableName`
### Файл: `backend/internal/models/title.go`
- Символы: (none detected)
### Файл: `backend/internal/models/translation.go`
- Символы: (none detected)
### Файл: `backend/internal/models/user.go`
- Символы: (none detected)
### Файл: `backend/internal/models/verification.go`
- Символы: (none detected)
### Файл: `backend/internal/models/video_label.go`
- Символы: (none detected)
### Файл: `backend/internal/models/voice_group.go`
- Символы: (none detected)
### Файл: `backend/internal/models/watch_party.go`
- Символы: `TableName`
### Файл: `backend/internal/security/password.go`
- Символы: `HashPassword`, `VerifyPassword`, `prehashPassword`
### Файл: `backend/internal/service/achievements.go`
- Символы: `ListAchievements`, `ListUserAchievements`
### Файл: `backend/internal/service/mal_top.go`
- Символы: `SyncMALTopAnime`
### Файл: `backend/internal/service/rating_worker.go`
- Символы: `StartAnimeAverageRatingWorker`, `recalcAnimeAverageRatings`
### Файл: `backend/internal/service/resend_email.go`
- Символы: `SendEmailChangeCode`, `SendPasswordResetEmail`, `SendVerificationEmail`, `getResendClient`, `sendEmail`
### Файл: `backend/internal/service/titles.go`
- Символы: `ListTitles`, `ListUserTitles`
### Файл: `backend/internal/validation/validation.go`
- Символы: `NormalizeAndValidateEmail`, `NormalizeAndValidateUsername`, `RegisterUsernameHint`, `SanitizeLoginIdentifier`, `SanitizeSearchQuery`, `UsernameErrorMessage`, `ValidatePassword`, `ValidatePasswordAndConfirm`, `containsControlOrUnsafe`, `isPasswordSpecial`, `isRussian`, `isUkrainian`, `isValidDomain`

## TS
### Файл: `frontend/app/(main)/anime/[slug]/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/(main)/catalog/loading.tsx`
- Символы: (none detected)
### Файл: `frontend/app/(main)/catalog/page.tsx`
- Символы: `getFirst`, `parseCsv`
### Файл: `frontend/app/(main)/collection/loading.tsx`
- Символы: (none detected)
### Файл: `frontend/app/(main)/collection/page.tsx`
- Символы: `getFirst`, `normalizeKind`, `parseCsv`
### Файл: `frontend/app/(main)/cookies/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/(main)/dmca/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/(main)/layout.tsx`
- Символы: (none detected)
### Файл: `frontend/app/(main)/mal/anime/[id]/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/(main)/mal/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/(main)/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/(main)/privacy/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/(main)/schedule/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/(main)/terms/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/(main)/top/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/(main)/watch-party/[roomId]/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/(main)/watch-party/join/[inviteCode]/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/(main)/watch-party/new/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/admin/achievements/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/admin/animes/[id]/page.tsx`
- Символы: `pickTranslation`
### Файл: `frontend/app/admin/animes/new/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/admin/animes/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/admin/faq/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/admin/kinds-ratings/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/admin/layout.tsx`
- Символы: (none detected)
### Файл: `frontend/app/admin/mal/callback/callback-client.tsx`
- Символы: `AdminMALCallbackClient`
### Файл: `frontend/app/admin/mal/callback/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/admin/mal/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/admin/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/admin/rules/page.tsx`
- Символы: `trimOrEmpty`
### Файл: `frontend/app/admin/schedule/page.tsx`
- Символы: `isTimePartialValid`, `normalizeTimeInput`, `toYMD`
### Файл: `frontend/app/admin/settings/layout.tsx`
- Символы: (none detected)
### Файл: `frontend/app/admin/settings/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/admin/settings/root/page.tsx`
- Символы: `clientPasswordError`
### Файл: `frontend/app/admin/titles/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/admin/user-profile/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/admin/users/[id]/edit/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/admin/users/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/admin/video-labels/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/faq/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/forgot-password/layout.tsx`
- Символы: (none detected)
### Файл: `frontend/app/forgot-password/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/layout.tsx`
- Символы: (none detected)
### Файл: `frontend/app/login/layout.tsx`
- Символы: (none detected)
### Файл: `frontend/app/login/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/not-found.tsx`
- Символы: (none detected)
### Файл: `frontend/app/profile/layout.tsx`
- Символы: (none detected)
### Файл: `frontend/app/profile/mylist/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/profile/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/register/layout.tsx`
- Символы: (none detected)
### Файл: `frontend/app/register/page.tsx`
- Символы: (none detected)
### Файл: `frontend/app/reset-password/layout.tsx`
- Символы: (none detected)
### Файл: `frontend/app/reset-password/page.tsx`
- Символы: `ResetPasswordContent`
### Файл: `frontend/app/rules/page.tsx`
- Символы: `pickLocalized`
### Файл: `frontend/app/verify-confirm/layout.tsx`
- Символы: (none detected)
### Файл: `frontend/app/verify-confirm/page.tsx`
- Символы: `VerifyConfirmContent`
### Файл: `frontend/app/verify-email/layout.tsx`
- Символы: (none detected)
### Файл: `frontend/app/verify-email/page.tsx`
- Символы: `VerifyEmailContent`
### Файл: `frontend/components/CookieConsent.tsx`
- Символы: (none detected)
### Файл: `frontend/components/admin/achievements/AchievementModal.tsx`
- Символы: `AchievementModal`
### Файл: `frontend/components/admin/achievements/AchievementsTable.tsx`
- Символы: `AchievementsTable`
### Файл: `frontend/components/admin/achievements/UserAchievementAssigner.tsx`
- Символы: `UserAchievementAssigner`
### Файл: `frontend/components/admin/faq/faq-delete-dialog.tsx`
- Символы: `FAQDeleteDialog`
### Файл: `frontend/components/admin/faq/faq-form-dialog.tsx`
- Символы: `FAQFormDialog`
### Файл: `frontend/components/admin/schedule/WeekdayPicker.tsx`
- Символы: `WeekdayPicker`
### Файл: `frontend/components/admin/titles/TitleModal.tsx`
- Символы: `TitleModal`
### Файл: `frontend/components/admin/titles/TitlesTable.tsx`
- Символы: `TitlesTable`
### Файл: `frontend/components/admin/titles/UserTitleAssigner.tsx`
- Символы: `UserTitleAssigner`
### Файл: `frontend/components/admin/users/BanUserModal.tsx`
- Символы: `BanUserModal`
### Файл: `frontend/components/admin/users/CreateUserModal.tsx`
- Символы: `CreateUserModal`
### Файл: `frontend/components/admin/users/Modal.tsx`
- Символы: `Modal`
### Файл: `frontend/components/admin/users/UserBadges.tsx`
- Символы: `RoleBadge`, `StatusBadge`
### Файл: `frontend/components/admin/users/UsersTable.tsx`
- Символы: `UsersTable`
### Файл: `frontend/components/admin/users/UsersToolbar.tsx`
- Символы: `UsersToolbar`
### Файл: `frontend/components/anime-card.tsx`
- Символы: `AnimeCard`, `handleStatusChange`
### Файл: `frontend/components/anime-status-manager.tsx`
- Символы: `AnimeStatusManager`
### Файл: `frontend/components/anime/add-to-user-list.tsx`
- Символы: `AddToUserList`
### Файл: `frontend/components/anime/anime-details-client.tsx`
- Символы: `AnimeDetailsClient`
### Файл: `frontend/components/anime/anime-player-container.tsx`
- Символы: `AnimePlayerContainer`, `extractIframeSrc`, `guessKind`, `normalizeIFrameUrl`, `toYouTubeEmbed`
### Файл: `frontend/components/anime/anime-rating.tsx`
- Символы: `AnimeRating`
### Файл: `frontend/components/anime/anime-stream-player.tsx`
- Символы: `AnimeStreamPlayer`, `applyKodikIframeSettings`, `extractIframeSrc`, `normalizeIFrameUrl`, `toYouTubeEmbed`, `withAutoplay`
### Файл: `frontend/components/anime/art-video-player.tsx`
- Символы: (none detected)
### Файл: `frontend/components/anime/gallery-section.tsx`
- Символы: `GallerySection`
### Файл: `frontend/components/anime/hero-header.tsx`
- Символы: `HeroHeader`
### Файл: `frontend/components/anime/navbar.tsx`
- Символы: `Navbar`
### Файл: `frontend/components/anime/similar-anime.tsx`
- Символы: `SimilarAnimeSection`
### Файл: `frontend/components/anime/source-selector.tsx`
- Символы: `SourceSelector`
### Файл: `frontend/components/anime/synopsis-section.tsx`
- Символы: `DetailRow`, `SynopsisSection`
### Файл: `frontend/components/anime/video-player.tsx`
- Символы: `VideoPlayer`
### Файл: `frontend/components/catalog/anime-card.tsx`
- Символы: `AnimeCard`
### Файл: `frontend/components/catalog/anime-grid.tsx`
- Символы: `AnimeGrid`
### Файл: `frontend/components/catalog/catalog-client.tsx`
- Символы: `CatalogClient`, `buildQuery`, `deriveFiltersFromParams`, `getFirst`, `parseCsv`, `parseNumber`
### Файл: `frontend/components/catalog/catalog-header.tsx`
- Символы: `CatalogHeader`
### Файл: `frontend/components/catalog/filter-sidebar.tsx`
- Символы: `FilterSection`, `FilterSidebar`
### Файл: `frontend/components/catalog/header.tsx`
- Символы: `Header`
### Файл: `frontend/components/catalog/mobile-filter-sheet.tsx`
- Символы: `MobileFilterSheet`
### Файл: `frontend/components/catalog/pagination.tsx`
- Символы: `Pagination`
### Файл: `frontend/components/catalog/search-bar.tsx`
- Символы: `SearchBar`
### Файл: `frontend/components/collection/collection-header.tsx`
- Символы: `CollectionHeader`, `clampText`
### Файл: `frontend/components/content-section.tsx`
- Символы: `ContentSection`
### Файл: `frontend/components/featured-sidebar.tsx`
- Символы: `FeaturedSidebar`
### Файл: `frontend/components/footer.tsx`
- Символы: `Footer`
### Файл: `frontend/components/hero-carousel.tsx`
- Символы: `HeroCarousel`
### Файл: `frontend/components/home/featured-anime-section.tsx`
- Символы: `FeaturedAnimeSection`
### Файл: `frontend/components/language-switcher.tsx`
- Символы: `LanguageSwitcher`
### Файл: `frontend/components/legal/legal-document-page.tsx`
- Символы: `LegalDocumentPage`
### Файл: `frontend/components/navbar-anime-search.tsx`
- Символы: `NavbarAnimeSearch`
### Файл: `frontend/components/navbar.tsx`
- Символы: `Navbar`
### Файл: `frontend/components/password-checklist.tsx`
- Символы: `PasswordChecklist`, `hasDigit`, `hasSpecial`, `hasUppercase`
### Файл: `frontend/components/profile/AchievementTags.tsx`
- Символы: `AchievementTags`, `localizedLabel`, `parseHexColor`, `pickTextColor`
### Файл: `frontend/components/profile/lists-sync-panel.tsx`
- Символы: `ListsSyncPanel`
### Файл: `frontend/components/schedule/anime-card.tsx`
- Символы: `AnimeCard`
### Файл: `frontend/components/schedule/day-tabs.tsx`
- Символы: `DayTabs`
### Файл: `frontend/components/schedule/header.tsx`
- Символы: `Header`
### Файл: `frontend/components/schedule/next-release.tsx`
- Символы: `NextRelease`
### Файл: `frontend/components/schedule/period-selector.tsx`
- Символы: `PeriodSelector`
### Файл: `frontend/components/schedule/release-list.tsx`
- Символы: `ReleaseList`
### Файл: `frontend/components/social-icons.tsx`
- Символы: `InstagramIcon`, `TwitterIcon`, `VkIcon`, `WhatsAppIcon`
### Файл: `frontend/components/theme-provider.tsx`
- Символы: `ThemeProvider`
### Файл: `frontend/components/theme-toggle.tsx`
- Символы: `ThemeToggle`
### Файл: `frontend/components/ui/accordion.tsx`
- Символы: `Accordion`, `AccordionContent`, `AccordionItem`, `AccordionTrigger`
### Файл: `frontend/components/ui/alert-dialog.tsx`
- Символы: `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogOverlay`, `AlertDialogPortal`, `AlertDialogTitle`, `AlertDialogTrigger`
### Файл: `frontend/components/ui/alert.tsx`
- Символы: `Alert`, `AlertDescription`, `AlertTitle`
### Файл: `frontend/components/ui/aspect-ratio.tsx`
- Символы: `AspectRatio`
### Файл: `frontend/components/ui/avatar.tsx`
- Символы: `Avatar`, `AvatarFallback`, `AvatarImage`
### Файл: `frontend/components/ui/badge.tsx`
- Символы: `Badge`
### Файл: `frontend/components/ui/breadcrumb.tsx`
- Символы: `Breadcrumb`, `BreadcrumbEllipsis`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbList`, `BreadcrumbPage`, `BreadcrumbSeparator`
### Файл: `frontend/components/ui/button-group.tsx`
- Символы: `ButtonGroup`, `ButtonGroupSeparator`, `ButtonGroupText`
### Файл: `frontend/components/ui/button.tsx`
- Символы: `Button`
### Файл: `frontend/components/ui/calendar.tsx`
- Символы: `Calendar`, `CalendarDayButton`
### Файл: `frontend/components/ui/card.tsx`
- Символы: `Card`, `CardAction`, `CardContent`, `CardDescription`, `CardFooter`, `CardHeader`, `CardTitle`
### Файл: `frontend/components/ui/carousel.tsx`
- Символы: `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselNext`, `CarouselPrevious`, `useCarousel`
### Файл: `frontend/components/ui/chart.tsx`
- Символы: `ChartContainer`, `ChartLegendContent`, `ChartTooltipContent`, `getPayloadConfigFromPayload`, `useChart`
### Файл: `frontend/components/ui/checkbox.tsx`
- Символы: `Checkbox`
### Файл: `frontend/components/ui/collapsible.tsx`
- Символы: `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger`
### Файл: `frontend/components/ui/command.tsx`
- Символы: `Command`, `CommandDialog`, `CommandEmpty`, `CommandGroup`, `CommandInput`, `CommandItem`, `CommandList`, `CommandSeparator`, `CommandShortcut`
### Файл: `frontend/components/ui/context-menu.tsx`
- Символы: `ContextMenu`, `ContextMenuCheckboxItem`, `ContextMenuContent`, `ContextMenuGroup`, `ContextMenuItem`, `ContextMenuLabel`, `ContextMenuPortal`, `ContextMenuRadioGroup`, `ContextMenuRadioItem`, `ContextMenuSeparator`, `ContextMenuShortcut`, `ContextMenuSub`, `ContextMenuSubContent`, `ContextMenuSubTrigger`, `ContextMenuTrigger`
### Файл: `frontend/components/ui/dialog.tsx`
- Символы: `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger`
### Файл: `frontend/components/ui/drawer.tsx`
- Символы: `Drawer`, `DrawerClose`, `DrawerContent`, `DrawerDescription`, `DrawerFooter`, `DrawerHeader`, `DrawerOverlay`, `DrawerPortal`, `DrawerTitle`, `DrawerTrigger`
### Файл: `frontend/components/ui/dropdown-menu.tsx`
- Символы: `DropdownMenu`, `DropdownMenuCheckboxItem`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuPortal`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, `DropdownMenuTrigger`
### Файл: `frontend/components/ui/empty.tsx`
- Символы: `Empty`, `EmptyContent`, `EmptyDescription`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`
### Файл: `frontend/components/ui/field.tsx`
- Символы: `Field`, `FieldContent`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldLabel`, `FieldLegend`, `FieldSeparator`, `FieldSet`, `FieldTitle`
### Файл: `frontend/components/ui/form.tsx`
- Символы: `FormControl`, `FormDescription`, `FormItem`, `FormLabel`, `FormMessage`
### Файл: `frontend/components/ui/hover-card.tsx`
- Символы: `HoverCard`, `HoverCardContent`, `HoverCardTrigger`
### Файл: `frontend/components/ui/input-group.tsx`
- Символы: `InputGroup`, `InputGroupAddon`, `InputGroupButton`, `InputGroupInput`, `InputGroupText`, `InputGroupTextarea`
### Файл: `frontend/components/ui/input-otp.tsx`
- Символы: `InputOTP`, `InputOTPGroup`, `InputOTPSeparator`, `InputOTPSlot`
### Файл: `frontend/components/ui/input.tsx`
- Символы: `Input`
### Файл: `frontend/components/ui/item.tsx`
- Символы: `Item`, `ItemActions`, `ItemContent`, `ItemDescription`, `ItemFooter`, `ItemGroup`, `ItemHeader`, `ItemMedia`, `ItemSeparator`, `ItemTitle`
### Файл: `frontend/components/ui/kbd.tsx`
- Символы: `Kbd`, `KbdGroup`
### Файл: `frontend/components/ui/label.tsx`
- Символы: `Label`
### Файл: `frontend/components/ui/markdown-lite.tsx`
- Символы: `MarkdownLiteText`, `isSafeHref`, `normalizeInput`, `parseAutoLinks`, `parseBoldItalic`, `parseItalic`, `parseMarkdownLite`
### Файл: `frontend/components/ui/menubar.tsx`
- Символы: `Menubar`, `MenubarCheckboxItem`, `MenubarContent`, `MenubarGroup`, `MenubarItem`, `MenubarLabel`, `MenubarMenu`, `MenubarPortal`, `MenubarRadioGroup`, `MenubarRadioItem`, `MenubarSeparator`, `MenubarShortcut`, `MenubarSub`, `MenubarSubContent`, `MenubarSubTrigger`, `MenubarTrigger`
### Файл: `frontend/components/ui/navigation-menu.tsx`
- Символы: `NavigationMenu`, `NavigationMenuContent`, `NavigationMenuIndicator`, `NavigationMenuItem`, `NavigationMenuLink`, `NavigationMenuList`, `NavigationMenuTrigger`, `NavigationMenuViewport`
### Файл: `frontend/components/ui/pagination.tsx`
- Символы: `Pagination`, `PaginationContent`, `PaginationEllipsis`, `PaginationItem`, `PaginationLink`, `PaginationNext`, `PaginationPrevious`
### Файл: `frontend/components/ui/popover.tsx`
- Символы: `Popover`, `PopoverAnchor`, `PopoverContent`, `PopoverTrigger`
### Файл: `frontend/components/ui/progress.tsx`
- Символы: `Progress`
### Файл: `frontend/components/ui/radio-group.tsx`
- Символы: `RadioGroup`, `RadioGroupItem`
### Файл: `frontend/components/ui/resizable.tsx`
- Символы: `ResizableHandle`, `ResizablePanel`, `ResizablePanelGroup`
### Файл: `frontend/components/ui/scroll-area.tsx`
- Символы: `ScrollArea`, `ScrollBar`
### Файл: `frontend/components/ui/select.tsx`
- Символы: `Select`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectLabel`, `SelectScrollDownButton`, `SelectScrollUpButton`, `SelectSeparator`, `SelectTrigger`, `SelectValue`
### Файл: `frontend/components/ui/separator.tsx`
- Символы: `Separator`
### Файл: `frontend/components/ui/sheet.tsx`
- Символы: `Sheet`, `SheetClose`, `SheetContent`, `SheetDescription`, `SheetFooter`, `SheetHeader`, `SheetOverlay`, `SheetPortal`, `SheetTitle`, `SheetTrigger`
### Файл: `frontend/components/ui/sidebar.tsx`
- Символы: `Sidebar`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarGroupAction`, `SidebarGroupContent`, `SidebarGroupLabel`, `SidebarHeader`, `SidebarInput`, `SidebarInset`, `SidebarMenu`, `SidebarMenuAction`, `SidebarMenuBadge`, `SidebarMenuButton`, `SidebarMenuItem`, `SidebarMenuSkeleton`, `SidebarMenuSub`, `SidebarMenuSubButton`, `SidebarMenuSubItem`, `SidebarProvider`, `SidebarRail`, `SidebarSeparator`, `SidebarTrigger`, `useSidebar`
### Файл: `frontend/components/ui/skeleton.tsx`
- Символы: `Skeleton`
### Файл: `frontend/components/ui/slider.tsx`
- Символы: `Slider`
### Файл: `frontend/components/ui/sonner.tsx`
- Символы: (none detected)
### Файл: `frontend/components/ui/spinner.tsx`
- Символы: `Spinner`
### Файл: `frontend/components/ui/switch.tsx`
- Символы: `Switch`
### Файл: `frontend/components/ui/table.tsx`
- Символы: `Table`, `TableBody`, `TableCaption`, `TableCell`, `TableFooter`, `TableHead`, `TableHeader`, `TableRow`
### Файл: `frontend/components/ui/tabs.tsx`
- Символы: `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
### Файл: `frontend/components/ui/textarea.tsx`
- Символы: `Textarea`
### Файл: `frontend/components/ui/toast.tsx`
- Символы: (none detected)
### Файл: `frontend/components/ui/toaster.tsx`
- Символы: `Toaster`
### Файл: `frontend/components/ui/toggle-group.tsx`
- Символы: `ToggleGroup`, `ToggleGroupItem`
### Файл: `frontend/components/ui/toggle.tsx`
- Символы: `Toggle`
### Файл: `frontend/components/ui/tooltip.tsx`
- Символы: `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger`
### Файл: `frontend/components/ui/use-mobile.tsx`
- Символы: `useIsMobile`
### Файл: `frontend/components/ui/use-toast.ts`
- Символы: `dispatch`, `genId`, `reducer`, `toast`, `useToast`
### Файл: `frontend/components/user-collection-card.tsx`
- Символы: `UserCollectionCard`
### Файл: `frontend/components/watch-party/watch-party-chat.tsx`
- Символы: `WatchPartyChat`
### Файл: `frontend/components/watch-party/watch-party-participants.tsx`
- Символы: `WatchPartyParticipants`
### Файл: `frontend/components/watch-party/watch-party-room-client.tsx`
- Символы: `WatchPartyRoomClient`
### Файл: `frontend/components/watch-party/watch-party-room-header.tsx`
- Символы: `WatchPartyRoomHeader`
### Файл: `frontend/contexts/auth-context.tsx`
- Символы: `AuthProvider`, `useAuth`
### Файл: `frontend/contexts/language-context.tsx`
- Символы: `LanguageProvider`, `useLanguage`
### Файл: `frontend/lib/admin/anime-fill/fill.ts`
- Символы: `fillDraftFromMalId`, `fillDraftFromShikimoriId`, `resolveShikiIdByMalId`
### Файл: `frontend/lib/admin/anime-fill/providers/mal-jikan.ts`
- Символы: `adminGetJikanAnimeData`, `adminSearchMal`, `applyJikanCommonToDraft`, `asISODate`, `ensureJikanMeta`, `mapJikanRatingToCode`, `mapJikanStatusToInternal`, `mapJikanTypeToKind`, `parseJikanDurationMinutes`, `pickJikanImageUrls`, `pickJikanTrailerUrl`, `readJikanAnimeFields`, `uniqTitles`, `uniqUrls`
### Файл: `frontend/lib/admin/anime-fill/providers/moonanime-ua.ts`
- Символы: `adminGetMoonanimeAnimeData`, `applyMoonanimeUATranslate`, `normName`, `normText`, `readMoonanimeUA`
### Файл: `frontend/lib/admin/anime-fill/providers/shikimori.ts`
- Символы: `adminGetShikimoriAnime`, `adminSearchShikimori`, `createMetaEnsurer`, `fillAnimeDraftFromShikimori`, `mapShikiRatingToCode`, `pickShikiPosterUrl`, `pickTrailerUrl`, `stripShikiBBCode`, `uniqTitles`
### Файл: `frontend/lib/anime-data.ts`
- Символы: (none detected)
### Файл: `frontend/lib/api.ts`
- Символы: `addToMyCollection`, `adminAssignAchievementToUser`, `adminAssignTitleToUser`, `adminBanUser`, `adminBulkAssignAchievementByRegisteredBefore`, `adminBulkAssignAchievementByRole`, `adminBulkAssignTitleByRegisteredBefore`, `adminBulkAssignTitleByRole`, `adminBulkUnassignAchievementByRole`, `adminBulkUnassignTitleByRole`, `adminCreateAchievement`, `adminCreateAnime`, `adminCreateEpisode`, `adminCreateFAQ`, `adminCreateGenre`, `adminCreateKind`, `adminCreateProducer`, `adminCreateRating`, `adminCreateRule`, `adminCreateSchedule`, `adminCreateSource`, `adminCreateStatus`, `adminCreateStudio`, `adminCreateTheme`, `adminCreateTitle`, `adminCreateUser`, `adminCreateVideoLabel`, `adminCreateVideoSource`, `adminCreateVoiceGroup`, `adminDeleteAchievement`, `adminDeleteAnime`, `adminDeleteEpisode`, `adminDeleteFAQ`, `adminDeleteGenre`, `adminDeleteKind`, `adminDeleteMALTopAnime`, `adminDeleteProducer`, `adminDeleteRating`, `adminDeleteRule`, `adminDeleteSchedule`, `adminDeleteSource`, `adminDeleteStatus`, `adminDeleteStudio`, `adminDeleteTheme`, `adminDeleteTitle`, `adminDeleteUser`, `adminDeleteVideoLabel`, `adminDeleteVideoSource`, `adminDeleteVoiceGroup`, `adminGetAnimeSyncStatus`, `adminGetMALTopAnime`, `adminGetMeta`, `adminGetUser`, `adminGetUserAchievements`, `adminGetUserProfileByUsername`, `adminGetUserTitles`, `adminJikanGetAnime`, `adminKodikBulkStart`, `adminKodikBulkStatus`, `adminKodikImportEpisodes`, `adminListAchievements`, `adminListFAQ`, `adminListFeaturedAnimes`, `adminListGenres`, `adminListKinds`, `adminListOngoingAnimes`, `adminListProducers`, `adminListRatings`, `adminListRules`, `adminListSchedule`, `adminListSources`, `adminListStatuses`, `adminListStudios`, `adminListThemes`, `adminListTitles`, `adminListUsers`, `adminListVideoLabels`, `adminListVoiceGroups`, `adminMalOAuthCallback`, `adminMalOAuthStart`, `adminMalRefreshTokens`, `adminMalRevokeTokens`, `adminMalTokenStatus`, `adminMoonanimeBulkStart`, `adminMoonanimeBulkStatus`, `adminMoonanimeGetAnime`, `adminMoonanimeImportEpisodes`, `adminPurgeOfflineWatchPartyRooms`, `adminPurgeOldSchedules`, `adminResetUserPasswordDefault`, `adminSetAnimeFeatured`, `adminSetAnimeGenres`, `adminSetAnimeThemes`, `adminSetDefaultPassword`, `adminSetDefaultVideoSource`, `adminSetFooterLinks`, `adminSetKodikPlayerSettings`, `adminSetPrivateMode`, `adminSetRegistrationDisabled`, `adminSetScheduleTimezone`, `adminShikimoriGetAnime`, `adminShikimoriSearch`, `adminSyncAnimeSchedule`, `adminSyncTopAnime`, `adminTransferRoot`, `adminTranslateThemesFromShikimori`, `adminUnassignAchievementFromUser`, `adminUnassignTitleFromUser`, `adminUnbanUser`, `adminUpdateAchievement`, `adminUpdateAnime`, `adminUpdateEpisode`, `adminUpdateFAQ`, `adminUpdateGenre`, `adminUpdateKind`, `adminUpdateProducer`, `adminUpdateRating`, `adminUpdateRule`, `adminUpdateSchedule`, `adminUpdateSource`, `adminUpdateStatus`, `adminUpdateStudio`, `adminUpdateTheme`, `adminUpdateTitle`, `adminUpdateUser`, `adminUpdateVideoLabel`, `adminUpdateVideoSource`, `adminUpdateVoiceGroup`, `adminUpsertMALTopAnime`, `clearMyCollections`, `createWatchPartyRoom`, `dissolveWatchPartyRoom`, `downloadShikimoriExport`, `forgotPassword`, `getAnimeBackgroundUrl`, `getAnimeByID`, `getAnimeBySlug`, `getAnimeEpisodes`, `getAnimeEpisodesBySlug`, `getAnimeEpisodesFiltered`, `getAnimePosterUrl`, `getAnimeRatingStats`, `getAnimes`, `getCatalogMeta`, `getFeaturedAnimes`, `getLocalizedDescription`, `getLocalizedEpisodeDescription`, `getLocalizedEpisodeName`, `getLocalizedTitle`, `getMALTopAnimeCatalog`, `getMe`, `getMyAnimeRating`, `getMyAnimeWatchProgress`, `getMyCollection`, `getPreferredLocale`, `getPublicFAQ`, `getPublicSettings`, `getRandomAnimeUrl`, `getSchedule`, `getWatchPartyRoom`, `getWatchPartyWsUrl`, `importCollectionsFromJson`, `importShikimoriCollections`, `joinWatchPartyRoom`, `listRules`, `maybeForceLogout`, `publicMalAnimeDetails`, `publicMalAnimeSearch`, `rateAnime`, `removeFromMyCollection`, `requestNewEmailCode`, `requestOldEmailCode`, `resendVerificationEmail`, `resetPassword`, `resolveSiteOrigin`, `resolveWatchPartyInvite`, `searchAnimes`, `setMyAnimeWatchProgress`, `setWatchPartyMemberRole`, `updateAge`, `updateMyCollectionEpisodesWatched`, `updatePassword`, `verifyEmailToken`, `verifyNewEmailCode`, `verifyOldEmailCode`
### Файл: `frontend/lib/collection-cache.ts`
- Символы: `getCollectionMap`, `key`, `removeCollectionStatus`, `setCollectionStatus`, `subscribeCollection`
### Файл: `frontend/lib/docx.ts`
- Символы: `loadDocxAsHtml`
### Файл: `frontend/lib/legal-documents.ts`
- Символы: (none detected)
### Файл: `frontend/lib/localized.ts`
- Символы: `pickAnimeTitle`, `pickDescription`, `pickName`, `toBcp47`
### Файл: `frontend/lib/roles.ts`
- Символы: `canManageUser`, `roleLabel`, `roleLevel`
### Файл: `frontend/lib/schedule-data.ts`
- Символы: `getNextRelease`
### Файл: `frontend/lib/slug.ts`
- Символы: `slugify`
### Файл: `frontend/lib/timezone.ts`
- Символы: `addDays`, `formatDateTimeInTimeZone`, `formatTimeInTimeZone`, `formatYMDInTimeZone`, `getDatePartsInTimeZone`, `labelForScheduleTimezone`, `weekdayIndexInTimeZone`
### Файл: `frontend/lib/translations.ts`
- Символы: (none detected)
### Файл: `frontend/lib/utils.ts`
- Символы: `cn`
### Файл: `frontend/lib/watch-party/moonanime-iframe.ts`
- Символы: `asBool`, `asNumber`

## SQL
### Файл: `backend/migrations/0001_schema.sql`
- Символы: `CREATE TABLE IF NOT EXISTS languages (`, `CREATE TABLE IF NOT EXISTS statuses (`, `CREATE TABLE IF NOT EXISTS sources (`, `CREATE TABLE IF NOT EXISTS collection_types (`, `CREATE TABLE IF NOT EXISTS genres (`, `CREATE TABLE IF NOT EXISTS studios (`, `CREATE TABLE IF NOT EXISTS kind_options (`, `CREATE TABLE IF NOT EXISTS rating_options (`, `CREATE TABLE IF NOT EXISTS users (`, `CREATE TABLE IF NOT EXISTS anime (`, `CREATE TABLE IF NOT EXISTS anime_translations (`, `CREATE TABLE IF NOT EXISTS status_translations (`, `CREATE TABLE IF NOT EXISTS source_translations (`, `CREATE TABLE IF NOT EXISTS studio_translations (`, `CREATE TABLE IF NOT EXISTS genre_translations (`, `CREATE TABLE IF NOT EXISTS collection_type_translations (`, `CREATE TABLE IF NOT EXISTS anime_genres (`, `CREATE TABLE IF NOT EXISTS user_collections (`, `CREATE TABLE IF NOT EXISTS voice_groups (`, `CREATE TABLE IF NOT EXISTS episodes (`
### Файл: `backend/migrations/0002_add_kind_ru_name.sql`
- Символы: `ALTER TABLE kind_options`
### Файл: `backend/migrations/0003_verification_codes.sql`
- Символы: `CREATE TABLE IF NOT EXISTS verification_codes (`
### Файл: `backend/migrations/0004_verification_codes_token_length.sql`
- Символы: `ALTER TABLE verification_codes`, `ALTER TABLE verification_codes`
### Файл: `backend/migrations/0005_user_ban_fields.sql`
- Символы: `ALTER TABLE users`, `ALTER TABLE users`, `ALTER TABLE users`, `ALTER TABLE users`
### Файл: `backend/migrations/0006_app_settings.sql`
- Символы: `CREATE TABLE IF NOT EXISTS app_settings (`
### Файл: `backend/migrations/0007_role_hierarchy_token_version.sql`
- Символы: `ALTER TABLE users`, `ALTER TABLE users`, `ALTER TABLE users`
### Файл: `backend/migrations/0008_users_single_root.sql`
- Символы: (none detected)
### Файл: `backend/migrations/0009_video_labels.sql`
- Символы: `CREATE TABLE IF NOT EXISTS video_labels (`, `CREATE TABLE IF NOT EXISTS video_sources (`, `ALTER TABLE video_sources ADD COLUMN IF NOT EXISTS label_id BIGINT;`, `ALTER TABLE video_sources`
### Файл: `backend/migrations/0010_user_ratings_avg_rating.sql`
- Символы: `ALTER TABLE anime`, `ALTER TABLE anime`, `CREATE TABLE user_ratings (`
### Файл: `backend/migrations/0011_user_ratings_range_0_9.sql`
- Символы: `ALTER TABLE user_ratings DROP CONSTRAINT user_ratings_rating_range;`, `ALTER TABLE user_ratings`
### Файл: `backend/migrations/0012_private_mode_setting.sql`
- Символы: (none detected)
### Файл: `backend/migrations/0013_schedule.sql`
- Символы: `CREATE TABLE schedules (`
### Файл: `backend/migrations/0014_schedule_timezone.sql`
- Символы: (none detected)
### Файл: `backend/migrations/0015_schedule_timezone_default_utc_plus_5.sql`
- Символы: (none detected)
### Файл: `backend/migrations/0016_episodes_video_sources_compat.sql`
- Символы: (none detected)
### Файл: `backend/migrations/0017_anime_featured.sql`
- Символы: `ALTER TABLE anime`, `ALTER TABLE anime`
### Файл: `backend/migrations/0018_faq_items.sql`
- Символы: `CREATE TABLE IF NOT EXISTS faq_items (`
### Файл: `backend/migrations/0019_registration_disabled_setting.sql`
- Символы: (none detected)
### Файл: `backend/migrations/0020_anime_alt_titles.sql`
- Символы: `CREATE TABLE IF NOT EXISTS anime_alt_titles (`
### Файл: `backend/migrations/0021_footer_links_settings.sql`
- Символы: (none detected)
### Файл: `backend/migrations/0022_faq_ru_fields.sql`
- Символы: `ALTER TABLE faq_items`
### Файл: `backend/migrations/0023_anime_ratings_hybrid.sql`
- Символы: `ALTER TABLE anime`, `CREATE TABLE IF NOT EXISTS anime_ratings (`
### Файл: `backend/migrations/0024_video_sources_audio_integrated.sql`
- Символы: `ALTER TABLE video_sources`
### Файл: `backend/migrations/0025_episode_sources_rewrite.sql`
- Символы: `ALTER TABLE episodes DROP CONSTRAINT IF EXISTS episodes_group_id_fkey;`, `ALTER TABLE episodes DROP CONSTRAINT IF EXISTS episodes_anime_id_server_number_group_id_number_key;`, `ALTER TABLE episodes DROP CONSTRAINT IF EXISTS idx_episode_unique;`, `ALTER TABLE episodes DROP COLUMN IF EXISTS group_id;`, `ALTER TABLE episodes DROP COLUMN IF EXISTS server_number;`, `ALTER TABLE episodes DROP COLUMN IF EXISTS video_url;`, `ALTER TABLE episodes ADD COLUMN IF NOT EXISTS kind VARCHAR(50) NOT NULL DEFAULT 'tv';`, `ALTER TABLE episodes ADD CONSTRAINT episodes_anime_id_number_key UNIQUE (anime_id, number);`, `ALTER TABLE video_sources ADD COLUMN IF NOT EXISTS voice_group_id INTEGER;`
### Файл: `backend/migrations/0026_anime_gallery_images.sql`
- Символы: `CREATE TABLE IF NOT EXISTS anime_gallery_images (`
### Файл: `backend/migrations/0027_anime_background_url.sql`
- Символы: `ALTER TABLE anime`
### Файл: `backend/migrations/0028_themes_and_producers.sql`
- Символы: `CREATE TABLE themes (`, `CREATE TABLE theme_translations (`, `CREATE TABLE anime_themes (`, `CREATE TABLE producers (`, `ALTER TABLE anime ADD COLUMN producer_id INTEGER REFERENCES producers(id) ON DELETE SET NULL;`
### Файл: `backend/migrations/0029_watch_party_rooms.sql`
- Символы: `CREATE TABLE watch_party_rooms (`, `CREATE TABLE watch_party_room_members (`, `CREATE TABLE watch_party_room_messages (`
### Файл: `backend/migrations/0030_anime_external_ids.sql`
- Символы: `ALTER TABLE anime`
### Файл: `backend/migrations/0030_watchparty_new_schema.sql`
- Символы: `CREATE TABLE watchparty_rooms (`, `CREATE TABLE watchparty_room_users (`
### Файл: `backend/migrations/0031_anime_shikimori_metadata.sql`
- Символы: `ALTER TABLE anime`
### Файл: `backend/migrations/0031_watchparty_content_state.sql`
- Символы: `ALTER TABLE watchparty_rooms`
### Файл: `backend/migrations/0032_anime_producers.sql`
- Символы: `CREATE TABLE IF NOT EXISTS anime_producers (`
### Файл: `backend/migrations/0032_watchparty_content_state_text.sql`
- Символы: `ALTER TABLE watchparty_rooms`, `ALTER TABLE watchparty_rooms`
### Файл: `backend/migrations/0033_remove_temp_admin.sql`
- Символы: `ALTER TABLE users DROP CONSTRAINT users_role_allowed;`, `ALTER TABLE users`
### Файл: `backend/migrations/0033_user_watch_progress.sql`
- Символы: `CREATE TABLE IF NOT EXISTS user_watch_progress (`
### Файл: `backend/migrations/0034_genre_theme_rating_descriptions.sql`
- Символы: `ALTER TABLE genres ADD COLUMN IF NOT EXISTS description_en TEXT;`, `ALTER TABLE genre_translations ADD COLUMN IF NOT EXISTS description TEXT;`, `ALTER TABLE themes ADD COLUMN IF NOT EXISTS description_en TEXT;`, `ALTER TABLE theme_translations ADD COLUMN IF NOT EXISTS description TEXT;`, `ALTER TABLE rating_options ADD COLUMN IF NOT EXISTS description_en TEXT;`, `ALTER TABLE rating_options ADD COLUMN IF NOT EXISTS description_ru TEXT;`
### Файл: `backend/migrations/0035_schedule_unique_anime_episode.sql`
- Символы: `ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_release_datetime_key;`, `ALTER TABLE schedules`
### Файл: `backend/migrations/0036_anime_seasons.sql`
- Символы: `ALTER TABLE anime`, `ALTER TABLE anime`, `ALTER TABLE anime`, `ALTER TABLE anime`
### Файл: `backend/migrations/0037_remove_alt_titles_limit.sql`
- Символы: (none detected)
### Файл: `backend/migrations/0038_add_rewatching_collection_type.sql`
- Символы: (none detected)
### Файл: `backend/migrations/0039_users_last_shiki_import_at.sql`
- Символы: `ALTER TABLE users`
### Файл: `backend/migrations/0040_drop_schedules_release_datetime_unique.sql`
- Символы: (none detected)
### Файл: `backend/migrations/0041_cleanup_schedule_duplicate_release_datetime.sql`
- Символы: (none detected)
### Файл: `backend/migrations/0042_mal_top_anime.sql`
- Символы: `CREATE TABLE IF NOT EXISTS mal_top_anime (`
### Файл: `backend/migrations/0043_mal_oauth_tokens.sql`
- Символы: `CREATE TABLE IF NOT EXISTS mal_oauth_tokens (`, `CREATE TABLE IF NOT EXISTS mal_oauth_state (`
### Файл: `backend/migrations/0044_uk_language_and_fields.sql`
- Символы: `ALTER TABLE kind_options`, `ALTER TABLE rating_options`, `ALTER TABLE faq_items`, `ALTER TABLE faq_items`
### Файл: `backend/migrations/0045_video_sources_vod_url.sql`
- Символы: `ALTER TABLE video_sources`
### Файл: `backend/migrations/0046_drop_episode_number_limit_trigger.sql`
- Символы: (none detected)
### Файл: `backend/migrations/0047_user_achievements.sql`
- Символы: `CREATE TABLE IF NOT EXISTS achievements (`, `CREATE TABLE IF NOT EXISTS user_achievements (`
### Файл: `backend/migrations/0048_titles.sql`
- Символы: `CREATE TABLE IF NOT EXISTS titles (`, `CREATE TABLE IF NOT EXISTS user_titles (`
### Файл: `backend/migrations/0049_achievements_optional_ru_uk.sql`
- Символы: `ALTER TABLE achievements`
### Файл: `backend/migrations/0050_rules.sql`
- Символы: `CREATE TABLE IF NOT EXISTS rules (`
