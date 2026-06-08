# Codebase Reference (Auto-generated)

This file is auto-generated. It lists source files and detected functions/components. Deep human-written descriptions are added separately over time.

## GO
### File: `backend/cmd/api/main.go`
- Symbols: `main`
### File: `backend/internal/app/db.go`
- Symbols: `InitDB`, `dropAllTables`, `runSQLMigrations`
### File: `backend/internal/app/ent.go`
- Symbols: `InitEnt`, `PostgresDSN`
### File: `backend/internal/app/seed.go`
- Symbols: `Seed`
### File: `backend/internal/config/config.go`
- Symbols: `CookieSameSite`, `CookieSecure`, `LoadConfig`, `getEnv`, `getEnvAsBool`, `splitCSV`, `uniqueNonEmpty`
### File: `backend/internal/handlers/admin.go`
- Symbols: `AdminCreateAnime`, `AdminDeleteAnime`, `AdminGetMeta`, `AdminUpdateAnime`, `derefStrSlice`, `parseOptionalDate`, `slugify`
### File: `backend/internal/handlers/admin_achievements.go`
- Symbols: `AdminAssignAchievementToUser`, `AdminBulkAssignAchievementByRegisteredBefore`, `AdminBulkAssignAchievementByRole`, `AdminBulkUnassignAchievementByRole`, `AdminCreateAchievement`, `AdminDeleteAchievement`, `AdminGetUserAchievements`, `AdminListAchievements`, `AdminUnassignAchievementFromUser`, `AdminUpdateAchievement`, `parseInt64Param`
### File: `backend/internal/handlers/admin_anime_sync.go`
- Symbols: `AdminAnimeSyncSchedule`, `AdminAnimeSyncStatus`, `SyncScheduleFromJikanAndShikimori`, `SyncScheduleFromShikimoriCalendar`, `absShikiURL`, `buildAltTitles`, `derefStr`, `ensureGenre`, `ensureKindOption`, `ensureProducer`, `ensureRatingOption`, `ensureSource`, `ensureStatus`, `ensureStudio`, `ensureTheme`, `getRootAdminTimezone`, `isShikiMissingImage`, `normalizeShikiRating`, `ptrInt`, `regexpReplaceAllString`, `stripShikiBBCode`, `toJSON`, `uniqueAnimeURL`, `uniqueInts`, `upsertAnimeFromShiki`, `upsertAnimeTranslation`, `upsertSchedule`, `upsertScheduleFutureOnly`
### File: `backend/internal/handlers/admin_email.go`
- Symbols: `AdminTestVerificationEmail`
### File: `backend/internal/handlers/admin_faq.go`
- Symbols: `AdminCreateFAQ`, `AdminDeleteFAQ`, `AdminListFAQ`, `AdminUpdateFAQ`
### File: `backend/internal/handlers/admin_mal_top.go`
- Symbols: `AdminDeleteMALTopAnime`, `AdminGetMALTopAnime`, `AdminUpsertMALTopAnime`
### File: `backend/internal/handlers/admin_root.go`
- Symbols: `AdminTransferRoot`
### File: `backend/internal/handlers/admin_schedule_animes.go`
- Symbols: `AdminListOngoingAnimes`
### File: `backend/internal/handlers/admin_settings.go`
- Symbols: `AdminSetDefaultPassword`, `AdminSetPrivateMode`, `AdminSetRegistrationDisabled`, `AdminSetScheduleTimezone`, `GetPublicSettings`, `getDefaultPassword`, `getScheduleTimezone`, `isAllowedScheduleTimezone`, `isRegistrationDisabled`, `loadScheduleLocation`, `mustScheduleLocation`, `normalizeScheduleTimezoneValue`, `recalcScheduleUTC`
### File: `backend/internal/handlers/admin_settings_test.go`
- Symbols: `TestLoadScheduleLocation`, `TestRecalcScheduleUTC_PreservesLocalClock`
### File: `backend/internal/handlers/admin_titles.go`
- Symbols: `AdminAssignTitleToUser`, `AdminBulkAssignTitleByRegisteredBefore`, `AdminBulkAssignTitleByRole`, `AdminBulkUnassignTitleByRole`, `AdminCreateTitle`, `AdminDeleteTitle`, `AdminGetUserTitles`, `AdminListTitles`, `AdminUnassignTitleFromUser`, `AdminUpdateTitle`, `parseInt64Param2`
### File: `backend/internal/handlers/admin_users.go`
- Symbols: `AdminBanUser`, `AdminCreateUser`, `AdminDeleteUser`, `AdminGetUser`, `AdminGetUserProfileByUsername`, `AdminListUsers`, `AdminResetUserPasswordDefault`, `AdminUnbanUser`, `AdminUpdateUser`, `adminRoleLevel`, `canActOnTarget`, `canAssignRole`
### File: `backend/internal/handlers/anime.go`
- Symbols: `GetAnimeByID`, `GetAnimes`, `splitCSVParam`
### File: `backend/internal/handlers/anime_alt_titles_util.go`
- Symbols: `normalizeAltTitles`, `replaceAnimeAltTitlesTx`
### File: `backend/internal/handlers/anime_gallery_util.go`
- Symbols: `isValidHTTPURL`, `normalizeGalleryURLs`, `replaceAnimeGalleryImagesTx`
### File: `backend/internal/handlers/anime_genres.go`
- Symbols: `AdminSetAnimeGenres`
### File: `backend/internal/handlers/anime_genres_util.go`
- Symbols: `setAnimeGenres`, `setAnimeGenresTx`
### File: `backend/internal/handlers/anime_producers_util.go`
- Symbols: `setAnimeProducers`, `setAnimeProducersTx`
### File: `backend/internal/handlers/anime_random.go`
- Symbols: `GetRandomAnime`
### File: `backend/internal/handlers/anime_seasons.go`
- Symbols: `buildSeasonsForAnime`, `validateAnimeSeasonFields`
### File: `backend/internal/handlers/anime_themes.go`
- Symbols: `AdminSetAnimeThemes`, `setAnimeThemes`, `setAnimeThemesTx`
### File: `backend/internal/handlers/auth.go`
- Symbols: `ForgotPassword`, `Login`, `Logout`, `Register`, `ResendVerification`, `ResetPassword`, `VerifyEmail`, `generateToken`, `publicWebBaseURL`
### File: `backend/internal/handlers/collection.go`
- Symbols: `AddToMyCollection`, `GetMyCollections`, `GetUserCollection`, `RemoveFromCollection`, `RemoveFromMyCollection`, `UpdateCollectionEntry`
### File: `backend/internal/handlers/collection_episodes_watched.go`
- Symbols: `UpdateMyCollectionEpisodesWatched`
### File: `backend/internal/handlers/collection_import_export.go`
- Symbols: `ClearMyCollections`, `ExportCollectionsToShikimoriJSON`, `ImportCollectionsFromJSON`
### File: `backend/internal/handlers/episode.go`
- Symbols: `AdminCreateEpisode`, `AdminCreateVideoSource`, `AdminDeleteEpisode`, `AdminDeleteVideoSource`, `AdminSetDefaultVideoSource`, `AdminUpdateEpisode`, `AdminUpdateVideoSource`, `GetAnimeEpisodes`, `getOrCreateVideoLabelByName`, `mapEpisodeDBError`
### File: `backend/internal/handlers/faq_public.go`
- Symbols: `GetPublicFAQ`, `pickFAQText`
### File: `backend/internal/handlers/featured_anime.go`
- Symbols: `AdminListFeaturedAnimes`, `AdminSetAnimeFeatured`, `GetFeaturedAnimes`
### File: `backend/internal/handlers/footer_settings.go`
- Symbols: `AdminSetFooterLinks`, `getFooterContactURL`, `getFooterSocialLinks`, `isValidFooterURL`
### File: `backend/internal/handlers/jikan.go`
- Symbols: `AdminJikanGetAnime`
### File: `backend/internal/handlers/kind_rating.go`
- Symbols: `AdminCreateKind`, `AdminCreateRating`, `AdminDeleteKind`, `AdminDeleteRating`, `AdminListKinds`, `AdminListRatings`, `AdminUpdateKind`, `AdminUpdateRating`
### File: `backend/internal/handlers/kodik_bulk.go`
- Symbols: `AdminKodikBulkStart`, `AdminKodikBulkStatus`, `runKodikBulk`
### File: `backend/internal/handlers/kodik_import.go`
- Symbols: `AdminKodikImportEpisodes`, `ensureVideoLabelTx`, `ensureVoiceGroupTx`, `kodikImportEpisodesForAnime`, `kodikSearchByShikimoriID`
### File: `backend/internal/handlers/kodik_settings.go`
- Symbols: `AdminSetKodikPlayerSettings`, `boolToString`, `getBoolSetting`, `getKodikGeoblock`, `getKodikHideSelectors`, `getKodikSkipEnabled`, `getKodikSkipValue`, `getSettingValue`, `normalizeCountryList`
### File: `backend/internal/handlers/mal_oauth.go`
- Symbols: `AdminMALOAuthCallback`, `AdminMALOAuthStart`, `AdminMALRefreshTokens`, `AdminMALRevokeTokens`, `AdminMALTokenStatus`, `exchangeMALToken`, `pkceChallenge`, `randBase64URL`, `refreshMALAccessToken`
### File: `backend/internal/handlers/mal_proxy.go`
- Symbols: `PublicMALAnimeDetails`, `PublicMALAnimeSearch`
### File: `backend/internal/handlers/mal_top.go`
- Symbols: `AdminSyncMALTopAnime`, `GetMALTopAnime`, `GetMALTopAnimeCatalog`
### File: `backend/internal/handlers/mal_top_hydrate.go`
- Symbols: `SyncMALTopAnimeAndHydrate`, `mapJikanRatingToInternal`, `mapJikanSourceToInternal`, `mapJikanStatusToInternal`, `mapJikanTypeToKind`, `parseJikanAiredDate`, `pickJikanPoster`, `upsertAnimeFromJikan`
### File: `backend/internal/handlers/meta.go`
- Symbols: `GetPublicCatalogMeta`
### File: `backend/internal/handlers/moonanime_anime.go`
- Symbols: `AdminMoonanimeGetAnime`, `moonanimeGetAnimeRaw`
### File: `backend/internal/handlers/moonanime_bulk.go`
- Symbols: `AdminMoonanimeBulkStart`, `AdminMoonanimeBulkStatus`, `runMoonanimeBulk`
### File: `backend/internal/handlers/moonanime_import.go`
- Symbols: `AdminMoonanimeImportEpisodes`, `fetchMoonanimeRecentEpisodesAll`, `fetchMoonanimeRecentEpisodesAllWith`, `fetchMoonanimeRecentEpisodesPageWith`, `moonanimeEntryKey`, `moonanimeImportEpisodesForAnime`
### File: `backend/internal/handlers/moonanime_import_test.go`
- Symbols: `TestFetchMoonanimeRecentEpisodesAllWith_PaginatesToWantedCount`
### File: `backend/internal/handlers/providers_aggregate.go`
- Symbols: `fetchShikiAnimeWithJikanEnrichment`
### File: `backend/internal/handlers/providers_mal_jikan.go`
- Symbols: `doMALGet`, `fetchJikanAnimeFull`, `fetchJikanEnrichment`, `getMALAccessToken`, `jikanGetAnimeRaw`
### File: `backend/internal/handlers/providers_shikimori.go`
- Symbols: `fetchShikimoriCalendar`, `shikimoriFetchUserRates`, `shikimoriGetAnimeByID`, `shikimoriGetAnimeRaw`, `shikimoriGetUserByUsername`, `shikimoriSearchAnimeList`
### File: `backend/internal/handlers/rating.go`
- Symbols: `GetAnimeAverageRating`, `GetMyAnimeRating`, `RateAnime`, `userIDFromContext`
### File: `backend/internal/handlers/rating_test.go`
- Symbols: `TestUserIDFromContext`
### File: `backend/internal/handlers/reference_lists.go`
- Symbols: `AdminCreateGenre`, `AdminCreateProducer`, `AdminCreateSource`, `AdminCreateStatus`, `AdminCreateStudio`, `AdminCreateTheme`, `AdminCreateVideoLabel`, `AdminDeleteGenre`, `AdminDeleteProducer`, `AdminDeleteSource`, `AdminDeleteStatus`, `AdminDeleteStudio`, `AdminDeleteTheme`, `AdminDeleteVideoLabel`, `AdminListGenres`, `AdminListProducers`, `AdminListSources`, `AdminListStatuses`, `AdminListStudios`, `AdminListThemes`, `AdminListVideoLabels`, `AdminTranslateThemesFromShikimori`, `AdminUpdateGenre`, `AdminUpdateProducer`, `AdminUpdateSource`, `AdminUpdateStatus`, `AdminUpdateStudio`, `AdminUpdateTheme`, `AdminUpdateVideoLabel`, `mapDeleteRefError`
### File: `backend/internal/handlers/ru_names.go`
- Symbols: `applyGenreRU`, `applySourceRU`, `applyStatusRU`, `applyStudioRU`, `applyThemeRU`, `getRuLanguageID`, `hydrateAnimeRefsRU`, `normalizeOptionalName`, `setGenreRUName`, `setSourceRUName`, `setStatusRUName`, `setStudioRUName`, `setThemeRUName`
### File: `backend/internal/handlers/rules.go`
- Symbols: `AdminCreateRule`, `AdminDeleteRule`, `AdminUpdateRule`, `ListRules`, `normalizeRuleInput`, `validateRuleText`
### File: `backend/internal/handlers/schedule.go`
- Symbols: `AdminCreateSchedule`, `AdminDeleteSchedule`, `AdminListSchedule`, `AdminPurgeOldSchedules`, `AdminUpdateSchedule`, `GetSchedule`, `getAnimeTitleByCode`, `isUniqueViolation`, `mapScheduleItem`, `parseScheduleRange`, `queryScheduleRange`
### File: `backend/internal/handlers/search.go`
- Symbols: `SearchAnimes`
### File: `backend/internal/handlers/shikimori.go`
- Symbols: `AdminShikimoriGetAnime`, `AdminShikimoriSearch`
### File: `backend/internal/handlers/shikimori_import.go`
- Symbols: `ImportShikimoriCollections`, `ensureAnimeByShikimoriID`, `upsertAnimeRating`
### File: `backend/internal/handlers/uk_names.go`
- Symbols: `applyGenreUK`, `applySourceUK`, `applyStatusUK`, `applyStudioUK`, `applyThemeUK`, `getUkLanguageID`, `hydrateAnimeRefsUK`, `setGenreUKName`, `setSourceUKName`, `setStatusUKName`, `setStudioUKName`, `setThemeUKName`
### File: `backend/internal/handlers/user.go`
- Symbols: `GetMe`, `GetProfile`, `RequestNewEmailCode`, `RequestOldEmailCode`, `UpdateAge`, `UpdatePassword`, `UpdateUsername`, `VerifyNewEmailCode`, `VerifyOldEmailCode`, `generateCode`
### File: `backend/internal/handlers/voice_group.go`
- Symbols: `AdminCreateVoiceGroup`, `AdminDeleteVoiceGroup`, `AdminListVoiceGroups`, `AdminUpdateVoiceGroup`
### File: `backend/internal/handlers/watch_party_admin.go`
- Symbols: `AdminPurgeOfflineRooms`
### File: `backend/internal/handlers/watch_party_hub.go`
- Symbols: `ActiveRoomIDs`, `AddChatMessage`, `AddUserToRoom`, `Broadcast`, `BroadcastExcept`, `DissolveRoom`, `GetChatSnapshot`, `GetRoomStateSnapshot`, `NewWatchPartyHub`, `RemoveUserFromRoom`, `SetOwnerAdPlaying`, `TransferOwnership`, `UpdateOwnerTime`, `UpdateRoomEpisode`, `UpdateRoomPlaying`, `cleanupRoom`, `sendToClients`, `sendToConn`, `sendUsersUpdate`, `snapshotUsersLocked`, `startJanitor`
### File: `backend/internal/handlers/watch_party_ws.go`
- Symbols: `CreateRoom`, `GetRoom`, `RoomWS`
### File: `backend/internal/handlers/watch_progress.go`
- Symbols: `GetMyAnimeWatchProgress`, `UpsertMyAnimeWatchProgress`
### File: `backend/internal/middleware/auth.go`
- Symbols: `AdminOnly`, `AuthMiddleware`, `DenyModeratorDelete`, `RequireMinRole`, `RootOnly`, `roleLevel`
### File: `backend/internal/middleware/import_rate_limit.go`
- Symbols: `ShikiImportRateLimit`
### File: `backend/internal/models/achievement.go`
- Symbols: (none detected)
### File: `backend/internal/models/anime.go`
- Symbols: `TableName`
### File: `backend/internal/models/anime_alt_title.go`
- Symbols: `TableName`
### File: `backend/internal/models/anime_gallery_image.go`
- Symbols: `TableName`
### File: `backend/internal/models/app_setting.go`
- Symbols: (none detected)
### File: `backend/internal/models/episode.go`
- Symbols: (none detected)
### File: `backend/internal/models/faq.go`
- Symbols: `TableName`
### File: `backend/internal/models/kind_option.go`
- Symbols: `TableName`
### File: `backend/internal/models/rating_option.go`
- Symbols: `TableName`
### File: `backend/internal/models/reference.go`
- Symbols: (none detected)
### File: `backend/internal/models/rule.go`
- Symbols: (none detected)
### File: `backend/internal/models/schedule_item.go`
- Symbols: `TableName`
### File: `backend/internal/models/title.go`
- Symbols: (none detected)
### File: `backend/internal/models/translation.go`
- Symbols: (none detected)
### File: `backend/internal/models/user.go`
- Symbols: (none detected)
### File: `backend/internal/models/verification.go`
- Symbols: (none detected)
### File: `backend/internal/models/video_label.go`
- Symbols: (none detected)
### File: `backend/internal/models/voice_group.go`
- Symbols: (none detected)
### File: `backend/internal/models/watch_party.go`
- Symbols: `TableName`
### File: `backend/internal/security/password.go`
- Symbols: `HashPassword`, `VerifyPassword`, `prehashPassword`
### File: `backend/internal/service/achievements.go`
- Symbols: `ListAchievements`, `ListUserAchievements`
### File: `backend/internal/service/mal_top.go`
- Symbols: `SyncMALTopAnime`
### File: `backend/internal/service/rating_worker.go`
- Symbols: `StartAnimeAverageRatingWorker`, `recalcAnimeAverageRatings`
### File: `backend/internal/service/resend_email.go`
- Symbols: `SendEmailChangeCode`, `SendPasswordResetEmail`, `SendVerificationEmail`, `getResendClient`, `sendEmail`
### File: `backend/internal/service/titles.go`
- Symbols: `ListTitles`, `ListUserTitles`
### File: `backend/internal/validation/validation.go`
- Symbols: `NormalizeAndValidateEmail`, `NormalizeAndValidateUsername`, `RegisterUsernameHint`, `SanitizeLoginIdentifier`, `SanitizeSearchQuery`, `UsernameErrorMessage`, `ValidatePassword`, `ValidatePasswordAndConfirm`, `containsControlOrUnsafe`, `isPasswordSpecial`, `isRussian`, `isUkrainian`, `isValidDomain`

## TS
### File: `frontend/app/(main)/anime/[slug]/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/(main)/catalog/loading.tsx`
- Symbols: (none detected)
### File: `frontend/app/(main)/catalog/page.tsx`
- Symbols: `getFirst`, `parseCsv`
### File: `frontend/app/(main)/collection/loading.tsx`
- Symbols: (none detected)
### File: `frontend/app/(main)/collection/page.tsx`
- Symbols: `getFirst`, `normalizeKind`, `parseCsv`
### File: `frontend/app/(main)/cookies/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/(main)/dmca/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/(main)/layout.tsx`
- Symbols: (none detected)
### File: `frontend/app/(main)/mal/anime/[id]/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/(main)/mal/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/(main)/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/(main)/privacy/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/(main)/schedule/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/(main)/terms/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/(main)/top/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/(main)/watch-party/[roomId]/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/(main)/watch-party/join/[inviteCode]/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/(main)/watch-party/new/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/admin/achievements/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/admin/animes/[id]/page.tsx`
- Symbols: `pickTranslation`
### File: `frontend/app/admin/animes/new/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/admin/animes/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/admin/faq/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/admin/kinds-ratings/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/admin/layout.tsx`
- Symbols: (none detected)
### File: `frontend/app/admin/mal/callback/callback-client.tsx`
- Symbols: `AdminMALCallbackClient`
### File: `frontend/app/admin/mal/callback/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/admin/mal/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/admin/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/admin/rules/page.tsx`
- Symbols: `trimOrEmpty`
### File: `frontend/app/admin/schedule/page.tsx`
- Symbols: `isTimePartialValid`, `normalizeTimeInput`, `toYMD`
### File: `frontend/app/admin/settings/layout.tsx`
- Symbols: (none detected)
### File: `frontend/app/admin/settings/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/admin/settings/root/page.tsx`
- Symbols: `clientPasswordError`
### File: `frontend/app/admin/titles/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/admin/user-profile/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/admin/users/[id]/edit/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/admin/users/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/admin/video-labels/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/faq/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/forgot-password/layout.tsx`
- Symbols: (none detected)
### File: `frontend/app/forgot-password/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/layout.tsx`
- Symbols: (none detected)
### File: `frontend/app/login/layout.tsx`
- Symbols: (none detected)
### File: `frontend/app/login/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/not-found.tsx`
- Symbols: (none detected)
### File: `frontend/app/profile/layout.tsx`
- Symbols: (none detected)
### File: `frontend/app/profile/mylist/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/profile/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/register/layout.tsx`
- Symbols: (none detected)
### File: `frontend/app/register/page.tsx`
- Symbols: (none detected)
### File: `frontend/app/reset-password/layout.tsx`
- Symbols: (none detected)
### File: `frontend/app/reset-password/page.tsx`
- Symbols: `ResetPasswordContent`
### File: `frontend/app/rules/page.tsx`
- Symbols: `pickLocalized`
### File: `frontend/app/verify-confirm/layout.tsx`
- Symbols: (none detected)
### File: `frontend/app/verify-confirm/page.tsx`
- Symbols: `VerifyConfirmContent`
### File: `frontend/app/verify-email/layout.tsx`
- Symbols: (none detected)
### File: `frontend/app/verify-email/page.tsx`
- Symbols: `VerifyEmailContent`
### File: `frontend/components/CookieConsent.tsx`
- Symbols: (none detected)
### File: `frontend/components/admin/achievements/AchievementModal.tsx`
- Symbols: `AchievementModal`
### File: `frontend/components/admin/achievements/AchievementsTable.tsx`
- Symbols: `AchievementsTable`
### File: `frontend/components/admin/achievements/UserAchievementAssigner.tsx`
- Symbols: `UserAchievementAssigner`
### File: `frontend/components/admin/faq/faq-delete-dialog.tsx`
- Symbols: `FAQDeleteDialog`
### File: `frontend/components/admin/faq/faq-form-dialog.tsx`
- Symbols: `FAQFormDialog`
### File: `frontend/components/admin/schedule/WeekdayPicker.tsx`
- Symbols: `WeekdayPicker`
### File: `frontend/components/admin/titles/TitleModal.tsx`
- Symbols: `TitleModal`
### File: `frontend/components/admin/titles/TitlesTable.tsx`
- Symbols: `TitlesTable`
### File: `frontend/components/admin/titles/UserTitleAssigner.tsx`
- Symbols: `UserTitleAssigner`
### File: `frontend/components/admin/users/BanUserModal.tsx`
- Symbols: `BanUserModal`
### File: `frontend/components/admin/users/CreateUserModal.tsx`
- Symbols: `CreateUserModal`
### File: `frontend/components/admin/users/Modal.tsx`
- Symbols: `Modal`
### File: `frontend/components/admin/users/UserBadges.tsx`
- Symbols: `RoleBadge`, `StatusBadge`
### File: `frontend/components/admin/users/UsersTable.tsx`
- Symbols: `UsersTable`
### File: `frontend/components/admin/users/UsersToolbar.tsx`
- Symbols: `UsersToolbar`
### File: `frontend/components/anime-card.tsx`
- Symbols: `AnimeCard`, `handleStatusChange`
### File: `frontend/components/anime-status-manager.tsx`
- Symbols: `AnimeStatusManager`
### File: `frontend/components/anime/add-to-user-list.tsx`
- Symbols: `AddToUserList`
### File: `frontend/components/anime/anime-details-client.tsx`
- Symbols: `AnimeDetailsClient`
### File: `frontend/components/anime/anime-player-container.tsx`
- Symbols: `AnimePlayerContainer`, `extractIframeSrc`, `guessKind`, `normalizeIFrameUrl`, `toYouTubeEmbed`
### File: `frontend/components/anime/anime-rating.tsx`
- Symbols: `AnimeRating`
### File: `frontend/components/anime/anime-stream-player.tsx`
- Symbols: `AnimeStreamPlayer`, `applyKodikIframeSettings`, `extractIframeSrc`, `normalizeIFrameUrl`, `toYouTubeEmbed`, `withAutoplay`
### File: `frontend/components/anime/art-video-player.tsx`
- Symbols: (none detected)
### File: `frontend/components/anime/gallery-section.tsx`
- Symbols: `GallerySection`
### File: `frontend/components/anime/hero-header.tsx`
- Symbols: `HeroHeader`
### File: `frontend/components/anime/navbar.tsx`
- Symbols: `Navbar`
### File: `frontend/components/anime/similar-anime.tsx`
- Symbols: `SimilarAnimeSection`
### File: `frontend/components/anime/source-selector.tsx`
- Symbols: `SourceSelector`
### File: `frontend/components/anime/synopsis-section.tsx`
- Symbols: `DetailRow`, `SynopsisSection`
### File: `frontend/components/anime/video-player.tsx`
- Symbols: `VideoPlayer`
### File: `frontend/components/catalog/anime-card.tsx`
- Symbols: `AnimeCard`
### File: `frontend/components/catalog/anime-grid.tsx`
- Symbols: `AnimeGrid`
### File: `frontend/components/catalog/catalog-client.tsx`
- Symbols: `CatalogClient`, `buildQuery`, `deriveFiltersFromParams`, `getFirst`, `parseCsv`, `parseNumber`
### File: `frontend/components/catalog/catalog-header.tsx`
- Symbols: `CatalogHeader`
### File: `frontend/components/catalog/filter-sidebar.tsx`
- Symbols: `FilterSection`, `FilterSidebar`
### File: `frontend/components/catalog/header.tsx`
- Symbols: `Header`
### File: `frontend/components/catalog/mobile-filter-sheet.tsx`
- Symbols: `MobileFilterSheet`
### File: `frontend/components/catalog/pagination.tsx`
- Symbols: `Pagination`
### File: `frontend/components/catalog/search-bar.tsx`
- Symbols: `SearchBar`
### File: `frontend/components/collection/collection-header.tsx`
- Symbols: `CollectionHeader`, `clampText`
### File: `frontend/components/content-section.tsx`
- Symbols: `ContentSection`
### File: `frontend/components/featured-sidebar.tsx`
- Symbols: `FeaturedSidebar`
### File: `frontend/components/footer.tsx`
- Symbols: `Footer`
### File: `frontend/components/hero-carousel.tsx`
- Symbols: `HeroCarousel`
### File: `frontend/components/home/featured-anime-section.tsx`
- Symbols: `FeaturedAnimeSection`
### File: `frontend/components/language-switcher.tsx`
- Symbols: `LanguageSwitcher`
### File: `frontend/components/legal/legal-document-page.tsx`
- Symbols: `LegalDocumentPage`
### File: `frontend/components/navbar-anime-search.tsx`
- Symbols: `NavbarAnimeSearch`
### File: `frontend/components/navbar.tsx`
- Symbols: `Navbar`
### File: `frontend/components/password-checklist.tsx`
- Symbols: `PasswordChecklist`, `hasDigit`, `hasSpecial`, `hasUppercase`
### File: `frontend/components/profile/AchievementTags.tsx`
- Symbols: `AchievementTags`, `localizedLabel`, `parseHexColor`, `pickTextColor`
### File: `frontend/components/profile/lists-sync-panel.tsx`
- Symbols: `ListsSyncPanel`
### File: `frontend/components/schedule/anime-card.tsx`
- Symbols: `AnimeCard`
### File: `frontend/components/schedule/day-tabs.tsx`
- Symbols: `DayTabs`
### File: `frontend/components/schedule/header.tsx`
- Symbols: `Header`
### File: `frontend/components/schedule/next-release.tsx`
- Symbols: `NextRelease`
### File: `frontend/components/schedule/period-selector.tsx`
- Symbols: `PeriodSelector`
### File: `frontend/components/schedule/release-list.tsx`
- Symbols: `ReleaseList`
### File: `frontend/components/social-icons.tsx`
- Symbols: `InstagramIcon`, `TwitterIcon`, `VkIcon`, `WhatsAppIcon`
### File: `frontend/components/theme-provider.tsx`
- Symbols: `ThemeProvider`
### File: `frontend/components/theme-toggle.tsx`
- Symbols: `ThemeToggle`
### File: `frontend/components/ui/accordion.tsx`
- Symbols: `Accordion`, `AccordionContent`, `AccordionItem`, `AccordionTrigger`
### File: `frontend/components/ui/alert-dialog.tsx`
- Symbols: `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogOverlay`, `AlertDialogPortal`, `AlertDialogTitle`, `AlertDialogTrigger`
### File: `frontend/components/ui/alert.tsx`
- Symbols: `Alert`, `AlertDescription`, `AlertTitle`
### File: `frontend/components/ui/aspect-ratio.tsx`
- Symbols: `AspectRatio`
### File: `frontend/components/ui/avatar.tsx`
- Symbols: `Avatar`, `AvatarFallback`, `AvatarImage`
### File: `frontend/components/ui/badge.tsx`
- Symbols: `Badge`
### File: `frontend/components/ui/breadcrumb.tsx`
- Symbols: `Breadcrumb`, `BreadcrumbEllipsis`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbList`, `BreadcrumbPage`, `BreadcrumbSeparator`
### File: `frontend/components/ui/button-group.tsx`
- Symbols: `ButtonGroup`, `ButtonGroupSeparator`, `ButtonGroupText`
### File: `frontend/components/ui/button.tsx`
- Symbols: `Button`
### File: `frontend/components/ui/calendar.tsx`
- Symbols: `Calendar`, `CalendarDayButton`
### File: `frontend/components/ui/card.tsx`
- Symbols: `Card`, `CardAction`, `CardContent`, `CardDescription`, `CardFooter`, `CardHeader`, `CardTitle`
### File: `frontend/components/ui/carousel.tsx`
- Symbols: `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselNext`, `CarouselPrevious`, `useCarousel`
### File: `frontend/components/ui/chart.tsx`
- Symbols: `ChartContainer`, `ChartLegendContent`, `ChartTooltipContent`, `getPayloadConfigFromPayload`, `useChart`
### File: `frontend/components/ui/checkbox.tsx`
- Symbols: `Checkbox`
### File: `frontend/components/ui/collapsible.tsx`
- Symbols: `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger`
### File: `frontend/components/ui/command.tsx`
- Symbols: `Command`, `CommandDialog`, `CommandEmpty`, `CommandGroup`, `CommandInput`, `CommandItem`, `CommandList`, `CommandSeparator`, `CommandShortcut`
### File: `frontend/components/ui/context-menu.tsx`
- Symbols: `ContextMenu`, `ContextMenuCheckboxItem`, `ContextMenuContent`, `ContextMenuGroup`, `ContextMenuItem`, `ContextMenuLabel`, `ContextMenuPortal`, `ContextMenuRadioGroup`, `ContextMenuRadioItem`, `ContextMenuSeparator`, `ContextMenuShortcut`, `ContextMenuSub`, `ContextMenuSubContent`, `ContextMenuSubTrigger`, `ContextMenuTrigger`
### File: `frontend/components/ui/dialog.tsx`
- Symbols: `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger`
### File: `frontend/components/ui/drawer.tsx`
- Symbols: `Drawer`, `DrawerClose`, `DrawerContent`, `DrawerDescription`, `DrawerFooter`, `DrawerHeader`, `DrawerOverlay`, `DrawerPortal`, `DrawerTitle`, `DrawerTrigger`
### File: `frontend/components/ui/dropdown-menu.tsx`
- Symbols: `DropdownMenu`, `DropdownMenuCheckboxItem`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuPortal`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, `DropdownMenuTrigger`
### File: `frontend/components/ui/empty.tsx`
- Symbols: `Empty`, `EmptyContent`, `EmptyDescription`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`
### File: `frontend/components/ui/field.tsx`
- Symbols: `Field`, `FieldContent`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldLabel`, `FieldLegend`, `FieldSeparator`, `FieldSet`, `FieldTitle`
### File: `frontend/components/ui/form.tsx`
- Symbols: `FormControl`, `FormDescription`, `FormItem`, `FormLabel`, `FormMessage`
### File: `frontend/components/ui/hover-card.tsx`
- Symbols: `HoverCard`, `HoverCardContent`, `HoverCardTrigger`
### File: `frontend/components/ui/input-group.tsx`
- Symbols: `InputGroup`, `InputGroupAddon`, `InputGroupButton`, `InputGroupInput`, `InputGroupText`, `InputGroupTextarea`
### File: `frontend/components/ui/input-otp.tsx`
- Symbols: `InputOTP`, `InputOTPGroup`, `InputOTPSeparator`, `InputOTPSlot`
### File: `frontend/components/ui/input.tsx`
- Symbols: `Input`
### File: `frontend/components/ui/item.tsx`
- Symbols: `Item`, `ItemActions`, `ItemContent`, `ItemDescription`, `ItemFooter`, `ItemGroup`, `ItemHeader`, `ItemMedia`, `ItemSeparator`, `ItemTitle`
### File: `frontend/components/ui/kbd.tsx`
- Symbols: `Kbd`, `KbdGroup`
### File: `frontend/components/ui/label.tsx`
- Symbols: `Label`
### File: `frontend/components/ui/markdown-lite.tsx`
- Symbols: `MarkdownLiteText`, `isSafeHref`, `normalizeInput`, `parseAutoLinks`, `parseBoldItalic`, `parseItalic`, `parseMarkdownLite`
### File: `frontend/components/ui/menubar.tsx`
- Symbols: `Menubar`, `MenubarCheckboxItem`, `MenubarContent`, `MenubarGroup`, `MenubarItem`, `MenubarLabel`, `MenubarMenu`, `MenubarPortal`, `MenubarRadioGroup`, `MenubarRadioItem`, `MenubarSeparator`, `MenubarShortcut`, `MenubarSub`, `MenubarSubContent`, `MenubarSubTrigger`, `MenubarTrigger`
### File: `frontend/components/ui/navigation-menu.tsx`
- Symbols: `NavigationMenu`, `NavigationMenuContent`, `NavigationMenuIndicator`, `NavigationMenuItem`, `NavigationMenuLink`, `NavigationMenuList`, `NavigationMenuTrigger`, `NavigationMenuViewport`
### File: `frontend/components/ui/pagination.tsx`
- Symbols: `Pagination`, `PaginationContent`, `PaginationEllipsis`, `PaginationItem`, `PaginationLink`, `PaginationNext`, `PaginationPrevious`
### File: `frontend/components/ui/popover.tsx`
- Symbols: `Popover`, `PopoverAnchor`, `PopoverContent`, `PopoverTrigger`
### File: `frontend/components/ui/progress.tsx`
- Symbols: `Progress`
### File: `frontend/components/ui/radio-group.tsx`
- Symbols: `RadioGroup`, `RadioGroupItem`
### File: `frontend/components/ui/resizable.tsx`
- Symbols: `ResizableHandle`, `ResizablePanel`, `ResizablePanelGroup`
### File: `frontend/components/ui/scroll-area.tsx`
- Symbols: `ScrollArea`, `ScrollBar`
### File: `frontend/components/ui/select.tsx`
- Symbols: `Select`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectLabel`, `SelectScrollDownButton`, `SelectScrollUpButton`, `SelectSeparator`, `SelectTrigger`, `SelectValue`
### File: `frontend/components/ui/separator.tsx`
- Symbols: `Separator`
### File: `frontend/components/ui/sheet.tsx`
- Symbols: `Sheet`, `SheetClose`, `SheetContent`, `SheetDescription`, `SheetFooter`, `SheetHeader`, `SheetOverlay`, `SheetPortal`, `SheetTitle`, `SheetTrigger`
### File: `frontend/components/ui/sidebar.tsx`
- Symbols: `Sidebar`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarGroupAction`, `SidebarGroupContent`, `SidebarGroupLabel`, `SidebarHeader`, `SidebarInput`, `SidebarInset`, `SidebarMenu`, `SidebarMenuAction`, `SidebarMenuBadge`, `SidebarMenuButton`, `SidebarMenuItem`, `SidebarMenuSkeleton`, `SidebarMenuSub`, `SidebarMenuSubButton`, `SidebarMenuSubItem`, `SidebarProvider`, `SidebarRail`, `SidebarSeparator`, `SidebarTrigger`, `useSidebar`
### File: `frontend/components/ui/skeleton.tsx`
- Symbols: `Skeleton`
### File: `frontend/components/ui/slider.tsx`
- Symbols: `Slider`
### File: `frontend/components/ui/sonner.tsx`
- Symbols: (none detected)
### File: `frontend/components/ui/spinner.tsx`
- Symbols: `Spinner`
### File: `frontend/components/ui/switch.tsx`
- Symbols: `Switch`
### File: `frontend/components/ui/table.tsx`
- Symbols: `Table`, `TableBody`, `TableCaption`, `TableCell`, `TableFooter`, `TableHead`, `TableHeader`, `TableRow`
### File: `frontend/components/ui/tabs.tsx`
- Symbols: `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
### File: `frontend/components/ui/textarea.tsx`
- Symbols: `Textarea`
### File: `frontend/components/ui/toast.tsx`
- Symbols: (none detected)
### File: `frontend/components/ui/toaster.tsx`
- Symbols: `Toaster`
### File: `frontend/components/ui/toggle-group.tsx`
- Symbols: `ToggleGroup`, `ToggleGroupItem`
### File: `frontend/components/ui/toggle.tsx`
- Symbols: `Toggle`
### File: `frontend/components/ui/tooltip.tsx`
- Symbols: `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger`
### File: `frontend/components/ui/use-mobile.tsx`
- Symbols: `useIsMobile`
### File: `frontend/components/ui/use-toast.ts`
- Symbols: `dispatch`, `genId`, `reducer`, `toast`, `useToast`
### File: `frontend/components/user-collection-card.tsx`
- Symbols: `UserCollectionCard`
### File: `frontend/components/watch-party/watch-party-chat.tsx`
- Symbols: `WatchPartyChat`
### File: `frontend/components/watch-party/watch-party-participants.tsx`
- Symbols: `WatchPartyParticipants`
### File: `frontend/components/watch-party/watch-party-room-client.tsx`
- Symbols: `WatchPartyRoomClient`
### File: `frontend/components/watch-party/watch-party-room-header.tsx`
- Symbols: `WatchPartyRoomHeader`
### File: `frontend/contexts/auth-context.tsx`
- Symbols: `AuthProvider`, `useAuth`
### File: `frontend/contexts/language-context.tsx`
- Symbols: `LanguageProvider`, `useLanguage`
### File: `frontend/lib/admin/anime-fill/fill.ts`
- Symbols: `fillDraftFromMalId`, `fillDraftFromShikimoriId`, `resolveShikiIdByMalId`
### File: `frontend/lib/admin/anime-fill/providers/mal-jikan.ts`
- Symbols: `adminGetJikanAnimeData`, `adminSearchMal`, `applyJikanCommonToDraft`, `asISODate`, `ensureJikanMeta`, `mapJikanRatingToCode`, `mapJikanStatusToInternal`, `mapJikanTypeToKind`, `parseJikanDurationMinutes`, `pickJikanImageUrls`, `pickJikanTrailerUrl`, `readJikanAnimeFields`, `uniqTitles`, `uniqUrls`
### File: `frontend/lib/admin/anime-fill/providers/moonanime-ua.ts`
- Symbols: `adminGetMoonanimeAnimeData`, `applyMoonanimeUATranslate`, `normName`, `normText`, `readMoonanimeUA`
### File: `frontend/lib/admin/anime-fill/providers/shikimori.ts`
- Symbols: `adminGetShikimoriAnime`, `adminSearchShikimori`, `createMetaEnsurer`, `fillAnimeDraftFromShikimori`, `mapShikiRatingToCode`, `pickShikiPosterUrl`, `pickTrailerUrl`, `stripShikiBBCode`, `uniqTitles`
### File: `frontend/lib/anime-data.ts`
- Symbols: (none detected)
### File: `frontend/lib/api.ts`
- Symbols: `addToMyCollection`, `adminAssignAchievementToUser`, `adminAssignTitleToUser`, `adminBanUser`, `adminBulkAssignAchievementByRegisteredBefore`, `adminBulkAssignAchievementByRole`, `adminBulkAssignTitleByRegisteredBefore`, `adminBulkAssignTitleByRole`, `adminBulkUnassignAchievementByRole`, `adminBulkUnassignTitleByRole`, `adminCreateAchievement`, `adminCreateAnime`, `adminCreateEpisode`, `adminCreateFAQ`, `adminCreateGenre`, `adminCreateKind`, `adminCreateProducer`, `adminCreateRating`, `adminCreateRule`, `adminCreateSchedule`, `adminCreateSource`, `adminCreateStatus`, `adminCreateStudio`, `adminCreateTheme`, `adminCreateTitle`, `adminCreateUser`, `adminCreateVideoLabel`, `adminCreateVideoSource`, `adminCreateVoiceGroup`, `adminDeleteAchievement`, `adminDeleteAnime`, `adminDeleteEpisode`, `adminDeleteFAQ`, `adminDeleteGenre`, `adminDeleteKind`, `adminDeleteMALTopAnime`, `adminDeleteProducer`, `adminDeleteRating`, `adminDeleteRule`, `adminDeleteSchedule`, `adminDeleteSource`, `adminDeleteStatus`, `adminDeleteStudio`, `adminDeleteTheme`, `adminDeleteTitle`, `adminDeleteUser`, `adminDeleteVideoLabel`, `adminDeleteVideoSource`, `adminDeleteVoiceGroup`, `adminGetAnimeSyncStatus`, `adminGetMALTopAnime`, `adminGetMeta`, `adminGetUser`, `adminGetUserAchievements`, `adminGetUserProfileByUsername`, `adminGetUserTitles`, `adminJikanGetAnime`, `adminKodikBulkStart`, `adminKodikBulkStatus`, `adminKodikImportEpisodes`, `adminListAchievements`, `adminListFAQ`, `adminListFeaturedAnimes`, `adminListGenres`, `adminListKinds`, `adminListOngoingAnimes`, `adminListProducers`, `adminListRatings`, `adminListRules`, `adminListSchedule`, `adminListSources`, `adminListStatuses`, `adminListStudios`, `adminListThemes`, `adminListTitles`, `adminListUsers`, `adminListVideoLabels`, `adminListVoiceGroups`, `adminMalOAuthCallback`, `adminMalOAuthStart`, `adminMalRefreshTokens`, `adminMalRevokeTokens`, `adminMalTokenStatus`, `adminMoonanimeBulkStart`, `adminMoonanimeBulkStatus`, `adminMoonanimeGetAnime`, `adminMoonanimeImportEpisodes`, `adminPurgeOfflineWatchPartyRooms`, `adminPurgeOldSchedules`, `adminResetUserPasswordDefault`, `adminSetAnimeFeatured`, `adminSetAnimeGenres`, `adminSetAnimeThemes`, `adminSetDefaultPassword`, `adminSetDefaultVideoSource`, `adminSetFooterLinks`, `adminSetKodikPlayerSettings`, `adminSetPrivateMode`, `adminSetRegistrationDisabled`, `adminSetScheduleTimezone`, `adminShikimoriGetAnime`, `adminShikimoriSearch`, `adminSyncAnimeSchedule`, `adminSyncTopAnime`, `adminTransferRoot`, `adminTranslateThemesFromShikimori`, `adminUnassignAchievementFromUser`, `adminUnassignTitleFromUser`, `adminUnbanUser`, `adminUpdateAchievement`, `adminUpdateAnime`, `adminUpdateEpisode`, `adminUpdateFAQ`, `adminUpdateGenre`, `adminUpdateKind`, `adminUpdateProducer`, `adminUpdateRating`, `adminUpdateRule`, `adminUpdateSchedule`, `adminUpdateSource`, `adminUpdateStatus`, `adminUpdateStudio`, `adminUpdateTheme`, `adminUpdateTitle`, `adminUpdateUser`, `adminUpdateVideoLabel`, `adminUpdateVideoSource`, `adminUpdateVoiceGroup`, `adminUpsertMALTopAnime`, `clearMyCollections`, `createWatchPartyRoom`, `dissolveWatchPartyRoom`, `downloadShikimoriExport`, `forgotPassword`, `getAnimeBackgroundUrl`, `getAnimeByID`, `getAnimeBySlug`, `getAnimeEpisodes`, `getAnimeEpisodesBySlug`, `getAnimeEpisodesFiltered`, `getAnimePosterUrl`, `getAnimeRatingStats`, `getAnimes`, `getCatalogMeta`, `getFeaturedAnimes`, `getLocalizedDescription`, `getLocalizedEpisodeDescription`, `getLocalizedEpisodeName`, `getLocalizedTitle`, `getMALTopAnimeCatalog`, `getMe`, `getMyAnimeRating`, `getMyAnimeWatchProgress`, `getMyCollection`, `getPreferredLocale`, `getPublicFAQ`, `getPublicSettings`, `getRandomAnimeUrl`, `getSchedule`, `getWatchPartyRoom`, `getWatchPartyWsUrl`, `importCollectionsFromJson`, `importShikimoriCollections`, `joinWatchPartyRoom`, `listRules`, `maybeForceLogout`, `publicMalAnimeDetails`, `publicMalAnimeSearch`, `rateAnime`, `removeFromMyCollection`, `requestNewEmailCode`, `requestOldEmailCode`, `resendVerificationEmail`, `resetPassword`, `resolveSiteOrigin`, `resolveWatchPartyInvite`, `searchAnimes`, `setMyAnimeWatchProgress`, `setWatchPartyMemberRole`, `updateAge`, `updateMyCollectionEpisodesWatched`, `updatePassword`, `verifyEmailToken`, `verifyNewEmailCode`, `verifyOldEmailCode`
### File: `frontend/lib/collection-cache.ts`
- Symbols: `getCollectionMap`, `key`, `removeCollectionStatus`, `setCollectionStatus`, `subscribeCollection`
### File: `frontend/lib/docx.ts`
- Symbols: `loadDocxAsHtml`
### File: `frontend/lib/legal-documents.ts`
- Symbols: (none detected)
### File: `frontend/lib/localized.ts`
- Symbols: `pickAnimeTitle`, `pickDescription`, `pickName`, `toBcp47`
### File: `frontend/lib/roles.ts`
- Symbols: `canManageUser`, `roleLabel`, `roleLevel`
### File: `frontend/lib/schedule-data.ts`
- Symbols: `getNextRelease`
### File: `frontend/lib/slug.ts`
- Symbols: `slugify`
### File: `frontend/lib/timezone.ts`
- Symbols: `addDays`, `formatDateTimeInTimeZone`, `formatTimeInTimeZone`, `formatYMDInTimeZone`, `getDatePartsInTimeZone`, `labelForScheduleTimezone`, `weekdayIndexInTimeZone`
### File: `frontend/lib/translations.ts`
- Symbols: (none detected)
### File: `frontend/lib/utils.ts`
- Symbols: `cn`
### File: `frontend/lib/watch-party/moonanime-iframe.ts`
- Symbols: `asBool`, `asNumber`

## SQL
### File: `backend/migrations/0001_schema.sql`
- Symbols: `CREATE TABLE IF NOT EXISTS languages (`, `CREATE TABLE IF NOT EXISTS statuses (`, `CREATE TABLE IF NOT EXISTS sources (`, `CREATE TABLE IF NOT EXISTS collection_types (`, `CREATE TABLE IF NOT EXISTS genres (`, `CREATE TABLE IF NOT EXISTS studios (`, `CREATE TABLE IF NOT EXISTS kind_options (`, `CREATE TABLE IF NOT EXISTS rating_options (`, `CREATE TABLE IF NOT EXISTS users (`, `CREATE TABLE IF NOT EXISTS anime (`, `CREATE TABLE IF NOT EXISTS anime_translations (`, `CREATE TABLE IF NOT EXISTS status_translations (`, `CREATE TABLE IF NOT EXISTS source_translations (`, `CREATE TABLE IF NOT EXISTS studio_translations (`, `CREATE TABLE IF NOT EXISTS genre_translations (`, `CREATE TABLE IF NOT EXISTS collection_type_translations (`, `CREATE TABLE IF NOT EXISTS anime_genres (`, `CREATE TABLE IF NOT EXISTS user_collections (`, `CREATE TABLE IF NOT EXISTS voice_groups (`, `CREATE TABLE IF NOT EXISTS episodes (`
### File: `backend/migrations/0002_add_kind_ru_name.sql`
- Symbols: `ALTER TABLE kind_options`
### File: `backend/migrations/0003_verification_codes.sql`
- Symbols: `CREATE TABLE IF NOT EXISTS verification_codes (`
### File: `backend/migrations/0004_verification_codes_token_length.sql`
- Symbols: `ALTER TABLE verification_codes`, `ALTER TABLE verification_codes`
### File: `backend/migrations/0005_user_ban_fields.sql`
- Symbols: `ALTER TABLE users`, `ALTER TABLE users`, `ALTER TABLE users`, `ALTER TABLE users`
### File: `backend/migrations/0006_app_settings.sql`
- Symbols: `CREATE TABLE IF NOT EXISTS app_settings (`
### File: `backend/migrations/0007_role_hierarchy_token_version.sql`
- Symbols: `ALTER TABLE users`, `ALTER TABLE users`, `ALTER TABLE users`
### File: `backend/migrations/0008_users_single_root.sql`
- Symbols: (none detected)
### File: `backend/migrations/0009_video_labels.sql`
- Symbols: `CREATE TABLE IF NOT EXISTS video_labels (`, `CREATE TABLE IF NOT EXISTS video_sources (`, `ALTER TABLE video_sources ADD COLUMN IF NOT EXISTS label_id BIGINT;`, `ALTER TABLE video_sources`
### File: `backend/migrations/0010_user_ratings_avg_rating.sql`
- Symbols: `ALTER TABLE anime`, `ALTER TABLE anime`, `CREATE TABLE user_ratings (`
### File: `backend/migrations/0011_user_ratings_range_0_9.sql`
- Symbols: `ALTER TABLE user_ratings DROP CONSTRAINT user_ratings_rating_range;`, `ALTER TABLE user_ratings`
### File: `backend/migrations/0012_private_mode_setting.sql`
- Symbols: (none detected)
### File: `backend/migrations/0013_schedule.sql`
- Symbols: `CREATE TABLE schedules (`
### File: `backend/migrations/0014_schedule_timezone.sql`
- Symbols: (none detected)
### File: `backend/migrations/0015_schedule_timezone_default_utc_plus_5.sql`
- Symbols: (none detected)
### File: `backend/migrations/0016_episodes_video_sources_compat.sql`
- Symbols: (none detected)
### File: `backend/migrations/0017_anime_featured.sql`
- Symbols: `ALTER TABLE anime`, `ALTER TABLE anime`
### File: `backend/migrations/0018_faq_items.sql`
- Symbols: `CREATE TABLE IF NOT EXISTS faq_items (`
### File: `backend/migrations/0019_registration_disabled_setting.sql`
- Symbols: (none detected)
### File: `backend/migrations/0020_anime_alt_titles.sql`
- Symbols: `CREATE TABLE IF NOT EXISTS anime_alt_titles (`
### File: `backend/migrations/0021_footer_links_settings.sql`
- Symbols: (none detected)
### File: `backend/migrations/0022_faq_ru_fields.sql`
- Symbols: `ALTER TABLE faq_items`
### File: `backend/migrations/0023_anime_ratings_hybrid.sql`
- Symbols: `ALTER TABLE anime`, `CREATE TABLE IF NOT EXISTS anime_ratings (`
### File: `backend/migrations/0024_video_sources_audio_integrated.sql`
- Symbols: `ALTER TABLE video_sources`
### File: `backend/migrations/0025_episode_sources_rewrite.sql`
- Symbols: `ALTER TABLE episodes DROP CONSTRAINT IF EXISTS episodes_group_id_fkey;`, `ALTER TABLE episodes DROP CONSTRAINT IF EXISTS episodes_anime_id_server_number_group_id_number_key;`, `ALTER TABLE episodes DROP CONSTRAINT IF EXISTS idx_episode_unique;`, `ALTER TABLE episodes DROP COLUMN IF EXISTS group_id;`, `ALTER TABLE episodes DROP COLUMN IF EXISTS server_number;`, `ALTER TABLE episodes DROP COLUMN IF EXISTS video_url;`, `ALTER TABLE episodes ADD COLUMN IF NOT EXISTS kind VARCHAR(50) NOT NULL DEFAULT 'tv';`, `ALTER TABLE episodes ADD CONSTRAINT episodes_anime_id_number_key UNIQUE (anime_id, number);`, `ALTER TABLE video_sources ADD COLUMN IF NOT EXISTS voice_group_id INTEGER;`
### File: `backend/migrations/0026_anime_gallery_images.sql`
- Symbols: `CREATE TABLE IF NOT EXISTS anime_gallery_images (`
### File: `backend/migrations/0027_anime_background_url.sql`
- Symbols: `ALTER TABLE anime`
### File: `backend/migrations/0028_themes_and_producers.sql`
- Symbols: `CREATE TABLE themes (`, `CREATE TABLE theme_translations (`, `CREATE TABLE anime_themes (`, `CREATE TABLE producers (`, `ALTER TABLE anime ADD COLUMN producer_id INTEGER REFERENCES producers(id) ON DELETE SET NULL;`
### File: `backend/migrations/0029_watch_party_rooms.sql`
- Symbols: `CREATE TABLE watch_party_rooms (`, `CREATE TABLE watch_party_room_members (`, `CREATE TABLE watch_party_room_messages (`
### File: `backend/migrations/0030_anime_external_ids.sql`
- Symbols: `ALTER TABLE anime`
### File: `backend/migrations/0030_watchparty_new_schema.sql`
- Symbols: `CREATE TABLE watchparty_rooms (`, `CREATE TABLE watchparty_room_users (`
### File: `backend/migrations/0031_anime_shikimori_metadata.sql`
- Symbols: `ALTER TABLE anime`
### File: `backend/migrations/0031_watchparty_content_state.sql`
- Symbols: `ALTER TABLE watchparty_rooms`
### File: `backend/migrations/0032_anime_producers.sql`
- Symbols: `CREATE TABLE IF NOT EXISTS anime_producers (`
### File: `backend/migrations/0032_watchparty_content_state_text.sql`
- Symbols: `ALTER TABLE watchparty_rooms`, `ALTER TABLE watchparty_rooms`
### File: `backend/migrations/0033_remove_temp_admin.sql`
- Symbols: `ALTER TABLE users DROP CONSTRAINT users_role_allowed;`, `ALTER TABLE users`
### File: `backend/migrations/0033_user_watch_progress.sql`
- Symbols: `CREATE TABLE IF NOT EXISTS user_watch_progress (`
### File: `backend/migrations/0034_genre_theme_rating_descriptions.sql`
- Symbols: `ALTER TABLE genres ADD COLUMN IF NOT EXISTS description_en TEXT;`, `ALTER TABLE genre_translations ADD COLUMN IF NOT EXISTS description TEXT;`, `ALTER TABLE themes ADD COLUMN IF NOT EXISTS description_en TEXT;`, `ALTER TABLE theme_translations ADD COLUMN IF NOT EXISTS description TEXT;`, `ALTER TABLE rating_options ADD COLUMN IF NOT EXISTS description_en TEXT;`, `ALTER TABLE rating_options ADD COLUMN IF NOT EXISTS description_ru TEXT;`
### File: `backend/migrations/0035_schedule_unique_anime_episode.sql`
- Symbols: `ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_release_datetime_key;`, `ALTER TABLE schedules`
### File: `backend/migrations/0036_anime_seasons.sql`
- Symbols: `ALTER TABLE anime`, `ALTER TABLE anime`, `ALTER TABLE anime`, `ALTER TABLE anime`
### File: `backend/migrations/0037_remove_alt_titles_limit.sql`
- Symbols: (none detected)
### File: `backend/migrations/0038_add_rewatching_collection_type.sql`
- Symbols: (none detected)
### File: `backend/migrations/0039_users_last_shiki_import_at.sql`
- Symbols: `ALTER TABLE users`
### File: `backend/migrations/0040_drop_schedules_release_datetime_unique.sql`
- Symbols: (none detected)
### File: `backend/migrations/0041_cleanup_schedule_duplicate_release_datetime.sql`
- Symbols: (none detected)
### File: `backend/migrations/0042_mal_top_anime.sql`
- Symbols: `CREATE TABLE IF NOT EXISTS mal_top_anime (`
### File: `backend/migrations/0043_mal_oauth_tokens.sql`
- Symbols: `CREATE TABLE IF NOT EXISTS mal_oauth_tokens (`, `CREATE TABLE IF NOT EXISTS mal_oauth_state (`
### File: `backend/migrations/0044_uk_language_and_fields.sql`
- Symbols: `ALTER TABLE kind_options`, `ALTER TABLE rating_options`, `ALTER TABLE faq_items`, `ALTER TABLE faq_items`
### File: `backend/migrations/0045_video_sources_vod_url.sql`
- Symbols: `ALTER TABLE video_sources`
### File: `backend/migrations/0046_drop_episode_number_limit_trigger.sql`
- Symbols: (none detected)
### File: `backend/migrations/0047_user_achievements.sql`
- Symbols: `CREATE TABLE IF NOT EXISTS achievements (`, `CREATE TABLE IF NOT EXISTS user_achievements (`
### File: `backend/migrations/0048_titles.sql`
- Symbols: `CREATE TABLE IF NOT EXISTS titles (`, `CREATE TABLE IF NOT EXISTS user_titles (`
### File: `backend/migrations/0049_achievements_optional_ru_uk.sql`
- Symbols: `ALTER TABLE achievements`
### File: `backend/migrations/0050_rules.sql`
- Symbols: `CREATE TABLE IF NOT EXISTS rules (`
