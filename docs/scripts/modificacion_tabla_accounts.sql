/*
   domingo, 17 de julio de 202210:37:28 p. m.
   User: db_innovacion
   Server: 192.168.251.155
   Database: CCBP
   Application: 
*/

/* To prevent any potential data loss issues, you should review this script in detail before running it outside the context of the database designer.*/
BEGIN TRANSACTION
SET QUOTED_IDENTIFIER ON
SET ARITHABORT ON
SET NUMERIC_ROUNDABORT OFF
SET CONCAT_NULL_YIELDS_NULL ON
SET ANSI_NULLS ON
SET ANSI_PADDING ON
SET ANSI_WARNINGS ON
COMMIT
BEGIN TRANSACTION
GO
ALTER TABLE ccbp.accounts ADD
	firstName varchar(50) NULL,
	lastName varchar(50) NULL
GO
ALTER TABLE ccbp.accounts SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'ccbp.accounts', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'ccbp.accounts', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'ccbp.accounts', 'Object', 'CONTROL') as Contr_Per 